import * as maquette from 'maquette'
import * as axios from 'axios'
import { createLevelSectionList } from './level-section-list'

let h = maquette.h


/**
 * Animation duration is relative (parabolic)
 * to the animation distance.
 */
let getAnimationDuration = (distance: number, t?: number) => {
  t = t || 200
  return t * Math.sqrt(distance / t)
}


// LoadingHeight is used as starting point
// for the enter animation.
let loadingHeight: number
let animateSubsectionEnter = (domNode: HTMLElement, properties: maquette.VNodeProperties) => {

  let startHeight: number
  let targetHeight: number = domNode.scrollHeight

  // The subsection enter animation can be into loading
  // or expanded state. When into expanded, we want the
  // loading height as our starting height.
  if ((/loading/).test(domNode.className)) {
    startHeight = 0
    loadingHeight = targetHeight
  } else {
    startHeight = loadingHeight
    // reset loadingHeight since loading-state
    // will be skipped next run.
    loadingHeight = 0
  }

  domNode.style.height = startHeight + 'px'

  let distance: number = Math.abs(targetHeight - startHeight)
  let duration: number = getAnimationDuration(distance, 700)

  Velocity.animate(domNode, { height: [ targetHeight, startHeight ] }, { duration, easing: 'ease-in' }).then( () => { // [70, 10]
    // Resetting height is required to ensure height adapts
    // when nested sections are being expanded.
    domNode.style.height = ''
  })
}


let animateSubsectionExit = (domNode: HTMLElement, removeDomNodeFunction: () => void, properties: maquette.VNodeProperties) => {

  let startHeight: number = domNode.scrollHeight

  // If loading node, don't animate
  if ((/loading/).test(domNode.className)) {
    removeDomNodeFunction()
  } else {
    //
    let distance: number = Math.abs(startHeight)
    let duration: number = getAnimationDuration(distance)

    Velocity.animate(domNode, { height: [ 0, startHeight ] }, { duration, easing: 'ease-in' }).then(() => {
      removeDomNodeFunction()
    })
  }
}


/**
 * When un-expeanding, we also un-expand all nested sections,
 * This way, the next time we expand this particular section,
 * all its subsections will be un-expanded.
 */
let unExpandSubSections = (sectionData: SectionData) => {
  sectionData.subSections.forEach((subSection: SectionData) => {
    subSection.expanded = false
    if (subSection.subSections) {
      subSection.subSections.forEach((subSubSection: SectionData) => {
        subSection.expanded = false
      })
    }
  })
}


/**
 * Creates a level-section-component instance.
 * On 'expansion' it will create more instances
 * for any of it's sub-sections.
 *
 * @returns { LevelSectionComponent }
 */
export let createLevelSectionComponent = (
  projector: maquette.Projector,
  config: {
    sectionData: SectionData,
    level: number,
    dataEndpoint: string,
    color: string
  }
): LevelSectionComponent => {

  let level = config.level ? config.level + 1 : 1

  let subLevelSectionComponentsArray: LevelSectionComponent[]
​
  let toggleExpand = (evt: MouseEvent) => {

    let target = <HTMLElement>evt.target
    if (target.tagName === 'A') {
      // follow href
    } else if ((/sub-sections|body|section-detail/).test(target.className)) {
      // ignore event
      evt.preventDefault()
    } else if (!evt.defaultPrevented) {
​
      // At level 3, we'll expand and show project-details
      // in stead of fetching subsection.
      if (level === 3) {
        // Ignore
      // Fetch subsections if needed
      } else if (!config.sectionData.subSections) {

        if (config.sectionData.hasSubSections) {

  ​        let start = new Date().getTime()

          let dataEndpoint = config.dataEndpoint + config.sectionData.id + '/subsections/'

          axios.get(dataEndpoint).then((response: Axios.AxiosXHR<SectionData[]>) => {

            config.sectionData.subSections = response.data

            subLevelSectionComponentsArray = config.sectionData.subSections.map(function (subSectionData: SectionData) {
              let conf = {
                sectionData: subSectionData,
                level: level,
                dataEndpoint: dataEndpoint,
                color: config.color
              };
              return createLevelSectionComponent(projector, conf);
            })

            // We'll use a minimal loading state duration of 800ms
            // to prevent a bumpy expand animation.
            let end = new Date().getTime()
            let elapsed = end - start
            let minimum = 400
            let timeout = 0

  ​          if (elapsed < minimum) {
              timeout = minimum - elapsed
            }

            setTimeout(() => {
              projector.scheduleRender()
            }, timeout)
          })
        } else {
          // No subbies :-(
        }
      }
​
      // When un-expanding, reset subsection expansion state
      if (config.sectionData.expanded && config.sectionData.subSections) {
        unExpandSubSections(config.sectionData)
      }
​
      // Toggle expansion
      config.sectionData.expanded = !config.sectionData.expanded

      // Prevent bubbling up the expansion event
      evt.preventDefault()
    }
  }
​
  let props: maquette.VNodeProperties = {
      key: config.sectionData.id,
      styles: {
        color: config.color
      },
      onclick: toggleExpand,
      'data-level': level.toString()
  }

  let activeSubHour: any

  let showTimeDetails = (event: any) => {
    let node = <any>event.currentTarget
    let subHourString = node.dataset['subhour']
    let subHour = JSON.parse(subHourString)
    activeSubHour = subHour
  }

  let hideTimeDetails = (event: any) => {
    let node: any = event.relatedTarget
    let parentNode: any = node ? node.parentNode : node
    let classes = node.className + parentNode.className
    if (!(/remaining-hours/).test(classes)) {
      activeSubHour = undefined
    }
  }

  let bubbleIn = (domNode: HTMLElement, properties: maquette.VNodeProperties) => {
    domNode.style.visibility = 'hidden'
    Velocity.animate(domNode, { scale: 0, opacity: 0 }, 1).then(() => {
      domNode.style.visibility = ''
      Velocity.animate(domNode, { scale: [1, 0], opacity: [1, 0] }, { delay: 400, duration: 280, easing: 'ease-out-circ' })
    })
  }

  let bubbleOut = (domNode: HTMLElement, removeDomNodeFunction: () => void, properties: maquette.VNodeProperties) => {

    // Cancel possible delay
    let w: any = <any>window;
    w.Velocity(domNode, 'stop', true);

    Velocity.animate(domNode, { scale: 0, opacity: [0, 1] }, { duration: 300, easing: 'ease-in-circ' }).then(removeDomNodeFunction)
  }


  let levelSectionComponent: LevelSectionComponent = {

    renderMaquette: (topLevelSwimLanes, subLevelSwimLanes) => {

      return h.section.levelSection(props, [
        h.div.box(


          level === 1 ? [
            h.div.sectionTitle(
              config.sectionData.icon ? [
                h.i.fa[config.sectionData.icon]()
              ] : [
                h.i.fa.faBookmarkO()
              ],
              config.sectionData.title,
              config.sectionData.wiki ? [
                h.a.wikiIcon.fa.faNewspaperO({ title: 'Ga naar de wiki', href: config.sectionData.wiki })
              ] : []
            )
          ] : [
            h.div.sectionDescription(config.sectionData.description,
              config.sectionData.wiki ? [
                h.a.wikiIconDeep.fa.faNewspaperO({ title: 'Ga naar de wiki', href: config.sectionData.wiki })
              ] : []
            )
          ],


          h.div.timeBox(
            config.sectionData.hours.subHours.map((subHour, i) => {
              if (true || subHour.total || subHour.remaining || subHour.used) {
                // debugger
                return h.div.subHour([
                  h.div.remainingHours({
                    key: config.sectionData + 'hours',
                    'data-subHour': JSON.stringify(subHour),
                    onmouseenter: showTimeDetails,
                    onmouseleave: hideTimeDetails
                  }, [
                    h.div.title(subHour.type),
                    h.div.value(subHour.remaining + '')
                  ])
                ])
              }
            }),
            activeSubHour ? [
              h.div.activeSubHour({
                classes: {
                  'is-ontwerp': activeSubHour.type === 'Ontwerp',
                  'is-realisatie': activeSubHour.type === 'Realisatie'
                },
                enterAnimation: bubbleIn,
                exitAnimation: bubbleOut
              }, [
                h.div.title('open'),
                h.div.remainingHours(activeSubHour.remaining),
                h.div.title('besteed'),
                h.div.usedHours(activeSubHour.used),
                h.div.title('totaal'),
                h.div.totalHours(activeSubHour.total)
              ])
            ] : []
          )
        ),


        config.sectionData.expanded ? [
          !config.sectionData.subSections && (config.sectionData.hasSubSections || level === 3) ? [
​            h.div.subSections(
              {
                key: 'loading',
                classes: {
                  'is-loading': level !== 3
                },
                enterAnimation: animateSubsectionEnter,
                exitAnimation: animateSubsectionExit
              },
              level === 3 ? [
                h.div.sectionDetail(
                  h.div.body(config.sectionData.body || '...'),
                  h.a.projectId({
                    target: '_blank',
                    href: `/project.html#${config.sectionData.id}`,
                    styles: {
                      backgroundColor: config.color
                    }
                  }, config.sectionData.id)
                )
              ] : [
                h.div.uilRingCss(h.div()),
              ]
            )
          ] : [
            ​h.div.subSections({
                classes: {
                  'is-expanded': true
                },
                enterAnimation: animateSubsectionEnter,
                exitAnimation: animateSubsectionExit
              },
              config.sectionData.hasSubSections ? [
                config.sectionData.subSections && config.sectionData.subSections.length && config.sectionData.expanded && subLevelSectionComponentsArray ? [
                  createLevelSectionList(subLevelSectionComponentsArray, level + 1, topLevelSwimLanes, subLevelSwimLanes)
                ] : [
                  h.div.noSubsectionsNotice('geen projecten')
                ]
              ] : [
                h.div.noSubsectionsNotice('geen projecten')
              ]
            )
          ]
        ] : []


      ])
    }
  }
  return levelSectionComponent
}
