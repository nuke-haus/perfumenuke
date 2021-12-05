class FormulaBody extends React.Component {

    state = {

    };

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
                        <input list="ingredients" value={ingredient.id || ""}/>
                    </td>
                    <td>
                        <input type="number" step="0.001" value={ingredient.grams || 0.0}/>
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
                    </tbody>
                </table>
            </div>
        );
    }
}