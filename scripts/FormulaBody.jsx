class FormulaBody extends React.Component {

    state = {
        tableKey: "table"
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
        console.log(id);
    }

    _changeQuantity(value, ingredient) {
        ingredient.quantity = value;
        console.log(value);
    }

    _renderDataList() {
        let elements = [];
        let count = 0;
        for (let ingredient of PN.database.materials) {
            count = count + 1;
            elements.push(<option key={"material" + count} label={ingredient.name} defaultValue={ingredient.id}/>);
        }
        for (let ingredient of PN.database.mixtures) {
            count = count + 1;
            if (ingredient.diluted_material != null) {
                elements.push(<option key={"dilution" + count} label={ingredient.name + PN.getDilutionPercentString(ingredient)} defaultValue={ingredient.id}/>);
            } else {
                elements.push(<option key={"mixture" + count} label={ingredient.name} defaultValue={ingredient.id}/>);
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
                        <input list="ingredients" value={ingredient.id || ""} onChange={(event) => this._changeIngredient(event.target.value, ingredient)}/>
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
                            <th/>
                        </tr>
                        {elements}
                        <tr>
                            <td>
                                <button type="button" onClick={() => this._addIngredient()}>New Ingredient</button>
                            </td>
                        </tr>
                    </tbody>
                </table>
                <table className="detailstable">
                    <tbody>
                        <tr>
                            <th>MATERIAL</th>
                            <th>FORMULA TOTAL (RAW)</th>
                            <th>FORMULA TOTAL (DILUTED)</th>
                            <th>WEIGHT (RAW)</th>
                            <th>WEIGHT (DILUTED)</th>
                            <th/>
                        </tr>
                    </tbody>
                </table>
            </div>
        );
    }
}