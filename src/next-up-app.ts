///<reference path='compact-dom-typings.d.ts' />
///<reference path='../typings/section-data.d.ts' />
///<reference path='../typings/maquette/maquette.d.ts' />
///<reference path='../typings/axios/axios.d.ts' />
///<reference path='../typings/velocity-animate/velocity-animate.d.ts' />
///<reference path='./velocity.d.ts' />
///<reference path='../typings/randomcolor.d.ts' />

import * as maquette from 'maquette'
import * as axios from 'axios'
import { randomColor } from 'randomcolor'

import { createLevelSectionList } from './level-section-list'
import { createLevelSectionComponent } from './level-section'
import { createTeamToggleComponent } from './team-toggle'


let h = maquette.h

let projector: maquette.Projector

let levelSectionComponentsArray: LevelSectionComponent[] = []

let teamToggleComponent: TeamToggleComponent

let hash = window.location.hash.replace(/#/, '').replace(/%20/, ' ');
let activeTeam: string = hash || localStorage.getItem('activeTeam') || 'Next Architectuur'

let dataEndpoint: string


/**
 * On initialisation and whenever the window is scaled
 * past the set breakpoint, we'll trigger a re-render.
 */

const topLevelBreakPoint = 800
const subLevelBreakPoint = 1200

let widthChange = () => {
  projector.scheduleRender()
}

let topLevelMediaQuery: MediaQueryList
let subLevelMediaQuery: MediaQueryList

if (window.matchMedia) {
  topLevelMediaQuery = window.matchMedia(`(min-width: ${topLevelBreakPoint}px)`)
  topLevelMediaQuery.addListener(widthChange)

  subLevelMediaQuery = window.matchMedia(`(min-width: ${subLevelBreakPoint}px)`)
  subLevelMediaQuery.addListener(widthChange)
}


/**
 * Array with predefined 'eastethical' colors.
 */
const availableColors: string[] = [
  '#5856d6', // purple
  '#ffbf00', // yellow
  '#5ac8fa', // sky-blue
  '#4cd964', // green
  '#ff2d55', // red
  '#007aff', // blue
  '#ff3b30', // orange-deep
  '#34aadc', // azur-blue
  '#8e8e93', // gray
  '#ff7a00', // orange-bright
];


let reversedSubHours = true;
let reverseSubHours: any;


/**
 * The app's main `renderMaquette` function.
 * @returns { maquette.VNode }
 */
let renderMaquette = () => {

  let components = levelSectionComponentsArray

  let nextUpApp = h.div.nextUpApp(
    teamToggleComponent.renderMaquette(),
    h.div.nextUpAppOutlet(
      createLevelSectionList(components, 1,  topLevelMediaQuery.matches, subLevelMediaQuery.matches, reversedSubHours)
    )
  )

  return  nextUpApp
}


/**
 * Checks if a given color is 'too bright'
 * for use in a level-section-component.
 * @param { sting } hex color string in need of testing
 * @returns { boolean }
 */
let colorIsTooLight = (color: string) => {

  // Check if not to light
  let c = color.substring(1);  // strip #
  let rgb = parseInt(c, 16);   // convert rrggbb to decimal
  let r = (rgb >> 16) & 0xff;  // extract red
  let g = (rgb >>  8) & 0xff;  // extract green
  let b = (rgb >>  0) & 0xff;  // extract blue

  let luma = 0.2126 * r + 0.7152 * g + 0.0722 * b; // per ITU-R BT.709
  return luma > 190
}


/**
 * Get a random color which is not too bright
 * @returns { string } hex color string
 */
let getRandomColor = () => {
  let color = randomColor();
  while (colorIsTooLight(color)) {
    color = randomColor();
  }
  return color
}


/**
 * Create an array of level-section-component's which we can
 * later render and save it to levelSectionComponentsArray.
 *
 * Called from `initialize` and `setActiveTeam`.
 * @param { array } section-data - Array with section-data object from API response
 */
let createLevelSectionComponents = (sectionDataArray: SectionData[]): void => {

  levelSectionComponentsArray = sectionDataArray.map((sectionData: SectionData, index: number) => {

    let color: string;

    if (sectionData.color) {
      // We either expect all or none of the sections
      // to have a defined color.
      color = sectionData.color
    } else if (index < availableColors.length) {
      // When there is no defined color we'll use the
      // predefined pretty colors list.
      color = availableColors[index];
    } else {
      // When we run out of predefined colors,
      // we'll use a random pretty color
      color = getRandomColor()
    }

    // return createLevelSectionComponent(projector, {sectionData, 0, projector, dataEndpoint, color: string: color })
    let conf = { reverseSubHours: reverseSubHours, sectionData: sectionData, level: 0, dataEndpoint: dataEndpoint, color: color }
    return createLevelSectionComponent(projector, conf)
  })
}

const apiRoot: string = window.location.pathname.replace(/planning\.html/, '/') + 'planning/';

/**
 * Fetch active-team releted data and
 * @type { FetchData }
 * @returns { Promise }
 */
let latestData: any; // SectionData[];
let fetchData: FetchData = () => {
  dataEndpoint = apiRoot + activeTeam + '/'
  return axios.get(dataEndpoint).then((response) => {
    latestData = response.data;
    return response;
  })
}

/**
 * App scoped function which returns the
 * currently active team-name.
 *
 * Called from the teamToggleComponent
 *
 * @returns {String} Returns the active
 * team-name as a string
 */
let getActiveTeam: GetActiveTeam = () => {
  return activeTeam
}


/**
 * App scoped function which set the active team,
 * fetches its data and creates its
 * sectionLevelComponents.
 *
 * Called by the teamToggleComponent
 */
let setActiveTeam: SetActiveTeam = (team, cb) => {
  // Update activeTeam
  activeTeam = team;
  // Update URL
  history.replaceState(null, null, window.location.pathname + '#' + activeTeam);
  // Update localStorage
  localStorage.setItem('activeTeam', activeTeam);
  // Fetch new data and create new sectionLevelComponents
  fetchData().then((response) => {
    createLevelSectionComponents(response.data)
    projector.scheduleRender()
    cb()
  });
}


/**
 * Initialize 'nextUpApp'
 */
let initialize = () => {

  projector = maquette.createProjector()

  fetchData().then((response) => {
    document.body.innerHTML = '';
    createLevelSectionComponents(response.data)
    projector.append(document.body, renderMaquette)
  });

  teamToggleComponent = createTeamToggleComponent(projector, { getActiveTeam: getActiveTeam, setActiveTeam: setActiveTeam })
}

reverseSubHours = (e: any) => { // MouseEvent
  if ((/first-child/).test(e.currentTarget.className)) {
    reversedSubHours = !reversedSubHours
    projector.scheduleRender()
    e.preventDefault();
  }
}

document.addEventListener('DOMContentLoaded', initialize, false)
