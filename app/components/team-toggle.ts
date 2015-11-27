import * as maquette from 'maquette'

let h = maquette.h


/**
 * Creates a team-toggle-component instance.
 *
 * @returns { TeamToggleComponent }
 */
export let createTeamToggleComponent = (
  projector: maquette.Projector,
  config: {
    getActiveTeam: GetActiveTeam, setActiveTeam: SetActiveTeam
  }): TeamToggleComponent => {

  let toggleIsActive = false

  let teams: string[] = [
   'NEXT Architectuur',
   'NEXT Patronen',
   'NEXT Model',
   'NEXT Overig',
   'NEXT UX (UI-Text)'
  ]

  let fadeIn = (domNode: HTMLElement, properties: maquette.VNodeProperties) => {
    domNode.style.opacity = '0'
    Velocity.animate(domNode, { opacity: [ 1, 0 ] }, { duration: 150, easing: [70, 10] })
  }

  let fadeOut = (domNode: HTMLElement, removeDomNodeFunction: () => void, properties: maquette.VNodeProperties) => {
    domNode.style.opacity = '1'
    Velocity.animate(domNode, { opacity:  [ 0, 1 ] }, { duration: 150, easing: 'ease-out' }).then(() => {
      removeDomNodeFunction();
    })
  }

  let toggleAction = (evt: MouseEvent) => {
    toggleIsActive = !toggleIsActive
    evt.preventDefault();
  }

  let isLoading: boolean;
  let activateTeamAction = (event: MouseEvent) => {
    let domNode = <HTMLElement>event.currentTarget;
    let isAlreadyActive = (/is-active/).test(domNode.className)

    if (!isAlreadyActive) {
      isLoading = true
      let activeTeam = domNode.dataset['team']
      config.setActiveTeam(activeTeam, () => {
        toggleIsActive = false
        isLoading = false
      })
    }
  }

  let bubbleIn = (domNode: HTMLElement, properties: maquette.VNodeProperties) => {
    domNode.style.visibility = 'hidden'
    Velocity.animate(domNode, { scale: 0, opacity: 0 }, 1).then(() => {
      domNode.style.visibility = ''
      Velocity.animate(domNode, { scale: [1, 0], opacity: [1, 0] }, { duration: 280, easing: 'ease-out-circ' })
    })
  }

  let bubbleOut = (domNode: HTMLElement, removeDomNodeFunction: () => void, properties: maquette.VNodeProperties) => {
    Velocity.animate(domNode, { scale: 0, opacity: [0, 1] }, { duration: 300, easing: 'ease-in-circ' }).then(removeDomNodeFunction)
  }

  let teamToggleComponent: TeamToggleComponent = {

    renderMaquette: () => {

      let activeTeam = config.getActiveTeam()

      return h.div.teamToggle(
        h.div.teamToggleActiveTeam(
          {
            key: toggleIsActive,
            onclick: toggleAction
          }, activeTeam),
        toggleIsActive ? [
          h.div.teamToggleCurtain({
            key: 'curtain',
            classes: {
              isLoading: isLoading
            },
            enterAnimation: fadeIn,
            exitAnimation: fadeOut,
            onclick: toggleAction
          }, [
            isLoading ? [
              h.div.uilRingCss(h.div())
            ] : []
          ]),
          h.div.teamToggleBubble(
            {
              enterAnimation: bubbleIn,
              exitAnimation: bubbleOut
            },
            teams.map(function (team: string) {
              return h.div.teamToggleTitle(
                {
                  key: team,
                  classes: {
                    'is-active': team === activeTeam
                  },
                  'data-team': team,
                  onclick: activateTeamAction
                },
              team)
            })
          )
        ] : []
      )
    }
  }

  return teamToggleComponent
}
