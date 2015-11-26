///<reference path='../typings/section-data.d.ts' />
import * as maquette from 'maquette'

let h = maquette.h


/**
 * When we have enough horizontal space, we'll create
 * swimlanes for the 1st and 2nd 'level' components.
 */
export let createLevelSectionList = (
  components: LevelSectionComponent[],
  level: number,
  topLevelSwimLanes: boolean,
  subLevelSwimLanes: boolean
): maquette.VNode[] => {

  let VNodes: maquette.VNode[]

  if ((level < 2 && topLevelSwimLanes) || subLevelSwimLanes && level < 3) {
    VNodes = [
      h.div.swimLane({ key: 'leftSwimLane' },
        components.map((component: LevelSectionComponent, index: number) => {
          if (index % 2 === 0) {
            return component.renderMaquette(topLevelSwimLanes, subLevelSwimLanes)
          }
        })
      ),
      h.div.swimLane({ key: 'rightSwimLane' },
        components.map((component: LevelSectionComponent, index: number) => {
          if (index % 2 !== 0) {
            return component.renderMaquette(topLevelSwimLanes, subLevelSwimLanes)
          }
        })
      )
    ]
  } else {
    VNodes = components.map((component: LevelSectionComponent) => {
      return component.renderMaquette(topLevelSwimLanes, subLevelSwimLanes)
    })
  }
  return VNodes
}
