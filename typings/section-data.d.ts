interface SectionData {
  id: string;
  title: string;
  description: string;
  body: string;
  hours: Hours;
  // remainingHours: string;
  // totalHours: string;
  subSections: SectionData[];
  expanded: boolean;
  original: any;
  icon?: string;
  color?: string;
  hasSubSections: boolean;
  wiki: string;
}

interface Hours {
  total: number;
  used: number;
  remaining: number;
  hasSubHours: boolean;
  subHours: SubHour[];
}

interface SubHour {
  type: string;
  total: number;
  used: number;
  remaining: number;
}

interface LevelSectionComponent {
  renderMaquette: (topLevelSwimLanes: boolean, subLevelSwimLanes: boolean) => maquette.VNode;
}

interface TeamToggleComponent {
  renderMaquette: () => maquette.VNode;
}

interface MediaQueryList {

}

interface ClassPojo {
  [index: string]: {
    icon: maquette.VNode;
  };
}

interface FetchData {
  () : Promise<Axios.AxiosXHR<SectionData[]>>;
}

interface GetActiveTeam {
  () : string;
}

interface SetActiveTeam {
  (team: string, cb: () => void) : void;
}
