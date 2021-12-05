class FormulaBody extends React.Component {

    state = {

    };

    _addIngredient() {
        PN.activeFormula.ingredients.push({});
    }

    _changeIngredient(event, ingredient) {
        console.log(event);
    }

    _changeQuantity(event, ingredient) {
        console.log(event);
    }

    _renderDataList() {
        let elements = [];
        let count = 0;
        for (let ingredient in PN.database.materials) {
            count = count + 1;
            elements.push(<option key={"material" + count} label={ingredient.name} value={ingredient.id}/>);
        }
        for (let ingredient in PN.database.mixtures) {
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
        let count = 0;
        for (let ingredient of PN.activeFormula.ingredients || []) {
            count = count + 1;
            elements.push(
                <tr key={"ingredient" + count}>
                    <td>
                        <input list="ingredients" value={ingredient.id || ""} onChange={(event) => this._changeIngredient(event, ingredient)}/>
                    </td>
                    <td>
                        <input type="number" step="0.001" value={ingredient.grams || 0.0} onChange={(event) => this._changeQuantity(event, ingredient)}/>
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
                            <th>FORMULA TOTAL (RAW)</th>
                            <th>FORMULA TOTAL (DILUTED)</th>
                            <th>WEIGHT (RAW)</th>
                            <th>WEIGHT (DILUTED)</th>
                        </tr>
                        {elements}
                        <tr>
                            <td>
                                <button type="button" onClick={() => this._addIngredient()}>New Ingredient</button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        );
    }
}