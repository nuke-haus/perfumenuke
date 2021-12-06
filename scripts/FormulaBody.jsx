class FormulaBody extends React.Component {

    state = {
        formulaKey: "table",
        detailsKey: "details"
    };

    _addIngredient() {
        PN.activeFormula.ingredients.push({id: "", quantity: 0.0});
        this.forceUpdate();
    }

    _deleteIngredient(index) {
        PN.activeFormula.ingredients.splice(index, 1);
        PN.recomputeFormula();
        this.setState({tableKey: PN.guid()});
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

    _renderDataList() {
        let elements = [];
        let count = 0;
        for (let ingredient of PN.database.materials) {
            if (ingredient.solvent) {
                continue;
            }
            count = count + 1;
            elements.push(<option key={"material" + count} label={ingredient.name} value={ingredient.id}/>);
        }
        for (let ingredient of PN.database.mixtures) {
            count = count + 1;
            if (ingredient.diluted_material != null) {
                elements.push(<option key={"dilution" + count} label={ingredient.name + PN.getDilutionPercentString(ingredient)} value={ingredient.id}/>);
            } else {
                elements.push(<option key={"mixture" + count} label={ingredient.name} value={ingredient.id}/>);
            }   
        }
        return (
            <datalist id="ingredients">
                {elements}
            </datalist>
        );
    }

    _renderDetailsRows() {
        const elements = [];
        for (let id in PN.activeFormula.computed) {
            const material = PN.getMaterial(id);
            elements.push(
                <tr key={'detail' + id}>
                    <td>{material.name || "NO NAME"}</td>
                    <td>{(PN.activeFormula.computed[id].quantity || 0).toPrecision(6)}</td>
                    <td>{(PN.activeFormula.computed[id].percent || 0).toPrecision(6)}</td>
                </tr>
            );
        }
        return elements;
    }

    render() {

        const elements = [];
        for (let index in PN.activeFormula.ingredients || []) {
            const ingredient = PN.activeFormula.ingredients[index]
            elements.push(
                <tr key={"ingredient" + index + this.state.tableKey}>
                    <td>
                        <input list="ingredients" defaultValue={ingredient.id || ""} onChange={(event) => this._changeIngredient(event.target.value, ingredient)}/>
                    </td>
                    <td>
                        <input type="number" step="0.001" defaultValue={ingredient.quantity || 0.0} onChange={(event) => this._changeQuantity(event.target.value, ingredient)}/>
                    </td>
                    <td>
                        <button type="button" onClick={() => this._deleteIngredient(index)}>Delete</button>
                    </td>
                </tr>
            );
        }

        return (
            <div>
                {this._renderDataList()}
                <div className="tabletext">
                    INGREDIENT LIST
                </div>
                <table className="formulatable">
                    <tbody>
                        <tr>
                            <th>INGREDIENT</th>
                            <th>WEIGHT (GRAMS)</th>
                        </tr>
                        {elements}
                        <tr>
                            <td colSpan="3">
                                <button type="button" onClick={() => this._addIngredient()}>New Ingredient</button>
                            </td>
                        </tr>
                    </tbody>
                </table>
                <div className="tabletext">
                    CONCENTRATE BREAKDOWN
                </div>
                <table className="formulatable" key={this.state.detailsKey}>
                    <tbody>
                        <tr>
                            <th>MATERIAL</th>
                            <th>WEIGHT (GRAMS)</th>
                            <th>% IN CONCENTRATE</th>
                        </tr>
                        {this._renderDetailsRows()}
                    </tbody>
                </table>
            </div>
        );
    }
}