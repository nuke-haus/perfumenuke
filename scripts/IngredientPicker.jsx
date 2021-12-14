class IngredientPicker extends React.Component {

    constructor(props) {
        super(props);
    }

    _getDefaultValue() { // convert an ID to a display name
        const material = PN.getMaterial(this.props.defaultValue);
        const mix = PN.getMixture(this.props.defaultValue);
        if (material != null) {
            return material.name;
        } else if (mix != null) {
            if (mix.diluted_material != null) {
                return mix.name + PN.getDilutionPercentString(mix);
            } else {
                return mix.name;
            }
        }
        return null;
    }

    _renderDataList() {
        this._nameMap = {};
        const elements = [];
        let count = 0;
        for (let id in PN.database.materials) {
            const ingredient = PN.getMaterial(id);
            if ((this.props.allowMaterials && !ingredient.solvent) || (this.props.allowSolvents && ingredient.solvent)) {
                count = count + 1;
                this._nameMap[ingredient.name] = ingredient.id;
                elements.push(<option key={"material" + count} value={ingredient.name}/>);
            }
        }
        if (this.props.allowMixtures) {
            for (let id in PN.database.mixtures) {
                const mix = PN.getMixture(id);
                const dilutionData = PN.getMixtureDilutionMaterial(mix);
                count = count + 1;
                if (dilutionData != null) {
                    const name = mix.name + PN.getDilutionPercentString(dilutionData.percent);
                    this._nameMap[name] = mix.id;
                    elements.push(<option key={"dilution" + count} value={name}/>);
                } else {
                    this._nameMap[mix.name] = mix.id;
                    elements.push(<option key={"mixture" + count} value={mix.name}/>);
                }   
            }
        }
        if (this.props.allowFormulas) {
            for (let id in PN.database.formulas) {
                const formula = PN.getFormula(id);
                count = count + 1;
                if (formula != null) {
                    this._nameMap[formula.name] = formula.id;
                    elements.push(<option key={"formula" + count} value={formula.name}/>);
                } 
            }
        }
        return (
            <datalist id={this.props.id}>
                {elements}
            </datalist>
        );
    }

    _onChange(value) {
        const id = this._nameMap[value]; // retrieve the ID using the display name 
        this.props.onChange(id);
    }

    render() {
        return (
            <div>
                {this._renderDataList()}
                <input list={this.props.id} 
                        className="ingredientpicker"
                        defaultValue={this._getDefaultValue()} 
                        onChange={(event) => this._onChange(event.target.value)}/>
            </div>
        );
    }
}

IngredientPicker.defaultProps = {
    allowFormulas: false,
    allowSolvents: false,
    allowMixtures: true,
    allowMaterials: true,
    id: 'ingredients',
    defaultValue: "",
    onChange: function(value){}
}