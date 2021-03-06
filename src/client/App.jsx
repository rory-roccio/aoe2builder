/* eslint-disable no-param-reassign */
/* eslint-disable react/jsx-filename-extension */
import React, { Component } from 'react';
import { StyleSheet, View } from 'react-native';
import Nav from './components/Nav.jsx';
import Time from './components/Time.jsx';
import Res from './components/Res.jsx';
import Buildings from './components/Buildings.jsx';
import Units from './components/Units.jsx';
import Techs from './components/Techs.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  display: {
    flex: 7,
    flexDirection: 'row',
    backgroundColor: 'dimgray',
  },
});

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      time: 0,
      // RATES
      woodRate: 0,
      foodRate: 0,
      goldRate: 0,
      stoneRate: 0,
      // RESOURCE STARTING TOTALS
      woodCount: 200,
      foodCount: 200,
      goldCount: 50,
      stoneCount: 200,
      // RESOURCE GATHERERS
      woodGatherers: 0,
      foodGatherers: 0,
      goldGatherers: 0,
      stoneGatherers: 0,
      // BUILDINGS/UNITS?TECHS IN BUILD
      buildings: [],
      units: [],
      techs: [],
      // ALL BUILDINGS/UNITS/TECHS FOR REFERENCE
      allBuildings: {},
      // APP INITIALIZING STATE
      initializing: true,
    };
    // BIND ALL FUNCTIONS
    this.getAllBuildings = this.getAllBuildings.bind(this);
    this.getBuilding = this.getBuilding.bind(this);
    this.addBuilding = this.addBuilding.bind(this);
    this.getUnit = this.getUnit.bind(this);
    this.setState = this.setState.bind(this);
  }

  componentDidMount() {
    // GET START UNITS ON LOAD
    const { getAllBuildings, addBuilding, getBuilding, getUnit, addUnit, setState } = this;

    getBuilding(8, (townCenter) => {
      addBuilding(townCenter, 0);
    });

    getUnit(24, (villager) => {
      addUnit(villager, 0);
      addUnit(villager, 0);
      addUnit(villager, 0);
    });

    getUnit(48, (scout) => {
      addUnit(scout, 0);
    });

    getAllBuildings(() => {
      setState((state) => ({ ...state, initializing: !state.initializing }));
    });
  }

  /*
    * API CALLS
  */

  getAllBuildings = (callback) => {
    const { allBuildings } = this.state;
    const { setState } = this;
    fetch('http://98.234.28.109:5040/buildings')
      .then((response) => response.json())
      .then((results) => {
        const totalBuildings = results.length; // count records to execut callback at proper time
        let count = 0;
        results.forEach((building) => {
          fetch(`http://98.234.28.109:5040/buildings/${building.buildingid}/units`)
            .then((response) => response.json())
            .then((units) => {
              building.units = units[0].name === null ? [] : units;
              fetch(`http://98.234.28.109:5040/buildings/${building.buildingid}/techs`)
                .then((response) => response.json())
                .then((techs) => {
                  building.techs = techs[0].name === null ? [] : techs;
                  allBuildings[`${building.name}`] = building;
                  setState((state) => ({ ...state, allBuildings }));
                  count += 1;
                  if (count === totalBuildings) {
                    callback();
                  }
                })
                .catch((err) => { console.error(err); });
            })
            .catch((err) => { console.error(err); });
        });
      })
      .catch((err) => { console.error(err); });
  };

  getBuilding = (buildingId, callback) => {
    fetch(`http://98.234.28.109:5040/buildings/${buildingId}`)
      .then((response) => response.json())
      .then((result) => {
        callback(result);
      })
      .catch((err) => { console.error(err); });
  };

  getUnit = (unitId, callback) => {
    fetch(`http://98.234.28.109:5040/units/${unitId}`)
      .then((response) => response.json())
      .then((result) => {
        callback(result[0]);
      })
      .catch((err) => { console.error(err); });
  };

  // FUNCTIONS TO ADD BUILDINGS TO BUILD SET
  addBuilding = (building, currentTime) => {
    const { initializing, buildings, woodCount, foodCount, goldCount, stoneCount } = this.state;
    const { wood, food, gold, stone, creationtime } = building;
    building.completesAt = initializing ? currentTime : currentTime + creationtime;
    building.tasks = [];
    buildings.push(building);
    if (!initializing) {
      if (wood > woodCount || food > foodCount || gold > goldCount || stone > stoneCount) {
        console.log('You do not have enough resources for this tech');
      } else {
        this.setState((state) => ({ ...state, woodCount: woodCount - wood, foodCount: foodCount - food, goldCount: goldCount - gold, stoneCount: stoneCount - stone }));
        this.setState((state) => ({ ...state, buildings }));
      }
    }
  };

  addUnit = (unit, currentTime) => {
    const { initializing, units, woodCount, foodCount, goldCount, stoneCount } = this.state;
    const { wood, food, gold, stone, creationtime } = unit;
    unit.completesAt = initializing ? currentTime : currentTime + creationtime;
    unit.tasks = [];
    units.push(unit);
    // CHECK RESOURCES
    if (!initializing) {
      if (wood > woodCount || food > foodCount || gold > goldCount || stone > stoneCount) {
        console.log('You do not have enough resources for this tech');
      } else {
        this.setState((state) => ({ ...state, woodCount: woodCount - wood, foodCount: foodCount - food, goldCount: goldCount - gold, stoneCount: stoneCount - stone }));
        this.setState((state) => ({ ...state, units }));
      }
    }
  };

  addTech = (tech, currentTime) => {
    const { techs, woodCount, foodCount, goldCount, stoneCount } = this.state;
    const { wood, food, gold, stone, creationtime } = tech;
    tech.completesAt = currentTime + creationtime;
    techs.push(tech);
    // CHECK RESOURCES
    if (wood > woodCount || food > foodCount || gold > goldCount || stone > stoneCount) {
      console.log('You do not have enough resources for this tech');
    } else {
      this.setState((state) => ({ ...state, woodCount: woodCount - wood, foodCount: foodCount - food, goldCount: goldCount - gold, stoneCount: stoneCount - stone }));
      this.setState((state) => ({ ...state, techs }));
    }
  };

  render() {
    const { time, allBuildings, woodCount, foodCount, goldCount, stoneCount, buildings, units, techs } = this.state;
    const { setState, addUnit, addBuilding, addTech } = this;

    return (
      <ErrorBoundary>
        <View style={styles.container}>
          <Nav />
          <Time time={time} setState={setState} />
          <Res resources={{ woodCount, foodCount, goldCount, stoneCount }} />
          <View style={styles.display}>
            <Buildings setState={setState} buildings={buildings} addUnit={addUnit} addTech={addTech} time={time} />
            <Units setState={setState} units={units} allBuildings={allBuildings} addBuilding={addBuilding} time={time} />
            <Techs techs={techs} time={time} />
          </View>
        </View>
      </ErrorBoundary>
    );
  }
}

export default App;
