class FormulaBody extends React.Component {

    state = {
        formulaKey: "table",
        detailsKey: "details"
    };

    _addIngredient() {
        PN.activeFormula.ingredients.push({id: "", quantity: 0.0});
        PN.recomputeFormula();
        this.forceUpdate();
    }

    _deleteIngredient(index) {
        PN.activeFormula.ingredients.splice(index, 1);
        PN.recomputeFormula();
        this.setState({tableKey: PN.guid()});
    }

    _changeDilution(id) {
        PN.activeFormula.dilutant = id;
        PN.recomputeFormula();
        this.setState({detailsKey: PN.guid()});
    }

    _changeDilutionQuantity(value) {
        PN.activeFormula.dilutantQuantity = Math.max(parseFloat(value), 0.0);
        PN.recomputeFormula();
        this.setState({detailsKey: PN.guid()});
    }

    _changeIngredient(id, ingredient) {
        ingredient.id = id;
        PN.recomputeFormula();
        this.setState({detailsKey: PN.guid()});
    }

    _changeQuantity(value, ingredient) {
        ingredient.quantity = Math.max(parseFloat(value), 0.0);
        PN.recomputeFormula();
        this.setState({detailsKey: PN.guid()});
    }

    _renderPercentInProduct(id, material) {
        const floatValue = (PN.activeFormula.computed[id].percentInProduct || 0).toPrecision(6);
        if (material.max_in_finished_product && floatValue > (material.max_in_finished_product * 100.0)) {
            return (
                <span className="error">{floatValue}</span>
            );
        } 
        return floatValue;
    }

    _getTooltip(id) {
        const material = PN.getMaterial(id);
        let tooltip = "";
        if (material != null) {
            tooltip = material.scent + " " + material.usage;
        } 
        return tooltip;
    }

    _renderDetailsRows() {
        const elements = [];
        for (let id in PN.activeFormula.computed) {
            const material = PN.getMaterial(id);
            const maxInProduct = material.max_in_finished_product == null 
                ? "" 
                : (material.max_in_finished_product * 100.0);
            const avgInConc = material.avg_in_concentrate == null 
                ? "" 
                : (material.avg_in_concentrate * 100.0);
            const maxInConc = material.max_in_concentrate == null 
                ? "" 
                : (material.max_in_concentrate * 100.0);
            elements.push(
                <tr key={'detail' + id}>
                    <td><div data-tooltip={this._getTooltip(material.id)}>{material.name || "???"}</div></td>
                    <td>{(PN.activeFormula.computed[id].quantity || 0).toPrecision(4)}</td>
                    <td>{(PN.activeFormula.computed[id].percent || 0).toPrecision(6)}</td>
                    <td>{avgInConc}</td>
                    <td>{maxInConc}</td>
                    <td>{this._renderPercentInProduct(id, material)}</td>
                    <td>{maxInProduct}</td>
                </tr>
            );
        }
        return elements;
    }

    render() {
        if (PN.activeFormula.computed.length > 0) {
            const concentrateChart = new Chart(
                document.getElementById('concentrateChart'),
                this._getConcentrateChartConfig()
            );
            const finalChart = new Chart(
                document.getElementById('finalProductChart'),
                this._getFinalChartConfig()
            );
        }
        const elements = [];
        for (let index in PN.activeFormula.ingredients || []) {
            const ingredient = PN.activeFormula.ingredients[index]
            elements.push(
                <tr key={"ingredient" + index + this.state.tableKey}>
                    <td>
                        <IngredientPicker defaultValue={ingredient.id}
                                          id={"ingredient" + index}
                                          onChange={(id) => this._changeIngredient(id, ingredient)}/>
                    </td>
                    <td>
                        <input type="number" 
                               step="0.001" 
                               min="0"
                               defaultValue={ingredient.quantity || 0.0} 
                               onChange={(event) => this._changeQuantity(event.target.value, ingredient)}/>
                    </td>
                    <td>
                        <button type="button" 
                                onClick={() => this._deleteIngredient(index)}>
                            Delete
                        </button>
                    </td>
                </tr>
            );
        }

        return (
            <div>
                <div className="tabletext">
                    INGREDIENT LIST
                </div>
                <table className="ingredienttable">
                    <tbody>
                        <tr>
                            <th>DILUTANT</th>
                            <th>WEIGHT (GRAMS)</th>
                        </tr>
                        <tr>
                            <td>
                                <IngredientPicker defaultValue={PN.activeFormula.dilutant}
                                                    id={"dilutant"}
                                                    allowSolvents={true}
                                                    allowMixtures={false}
                                                    allowMaterials={false}
                                                    onChange={(id) => this._changeDilution(id)}/>
                            </td>
                            <td>
                                <input type="number" 
                                    step="0.001" 
                                    min="0"
                                    defaultValue={PN.activeFormula.dilutantQuantity} 
                                    onChange={(event) => this._changeDilutionQuantity(event.target.value)}/>
                            </td>
                        </tr>
                        <tr>
                            <th>INGREDIENT</th>
                            <th></th>
                        </tr>
                        {elements}
                        <tr>
                            <td colSpan="3">
                                <button type="button" 
                                        onClick={() => this._addIngredient()}>
                                    New Ingredient
                                </button>
                            </td>
                        </tr>
                    </tbody>
                </table>
                <div className="tabletext">
                    MATERIAL MANIFEST
                </div>
                <table className="formulatable" key={this.state.detailsKey}>
                    <tbody>
                        <tr>
                            <th>MATERIAL</th>
                            <th>WEIGHT (GRAMS)</th>
                            <th>% IN CONCENTRATE</th>
                            <th>AVG % USED IN CONCENTRATE</th>
                            <th>MAX % ADVISED IN CONCENTRATE</th>
                            <th>% IN FINISHED PRODUCT</th>
                            <th>MAX % IN FINISHED PRODUCT (IFRA)</th>
                        </tr>
                        {this._renderDetailsRows()}
                    </tbody>
                </table>
            </div>
        );
    }
}