class FormulaBody extends React.Component {

    state = {
        formulaKey: "table",
        detailsKey: "details"
    };

    _addIngredient() {
        PN.activeFormula.ingredients.push({});
        this.forceUpdate();
    }

    _deleteIngredient(index) {
        PN.activeFormula.ingredients.splice(index, 1);
        this.setState({tableKey: PN.guid()});
    }

    _changeIngredient(id, ingredient) {
        ingredient.id = id;
        this.setState({detailsKey: PN.guid()});
    }

    _changeQuantity(value, ingredient) {
        ingredient.quantity = value;
        this.setState({detailsKey: PN.guid()});
    }

    _renderDataList() {
        let elements = [];
        let count = 0;
        for (let ingredient of PN.database.materials) {
            if (ingredient.solvent != null) {
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
        )
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
                <table className="formulatable">
                    <tbody>
                        <tr>
                            <th>INGREDIENT</th>
                            <th>GRAMS ADDED</th>
                        </tr>
                        {elements}
                        <tr>
                            <td colspan="2">
                                <button type="button" onClick={() => this._addIngredient()}>New Ingredient</button>
                            </td>
                        </tr>
                    </tbody>
                </table>
                <table className="detailstable" key={this.state.detailsKey}>
                    <tbody>
                        <tr>
                            <th>MATERIAL</th>
                            <th>FORMULA TOTAL (RAW)</th>
                            <th>FORMULA TOTAL (DILUTED)</th>
                            <th>WEIGHT (RAW)</th>
                            <th>WEIGHT (DILUTED)</th>
                        </tr>
                    </tbody>
                </table>
            </div>
        );
    }
}