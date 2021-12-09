class IngredientPicker extends React.Component {

    constructor(props) {
        super(props);
        this._updateTooltip(this.props.defaultValue);
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
        for (let ingredient of PN.database.materials) {
            if ((this.props.allowMaterials && !ingredient.solvent) || (this.props.allowSolvents && ingredient.solvent)) {
                count = count + 1;
                this._nameMap[ingredient.name] = ingredient.id;
                elements.push(<option key={"material" + count} value={ingredient.name}/>);
            }
        }
        if (this.props.allowMixtures) {
            for (let ingredient of PN.database.mixtures) {
                count = count + 1;
                if (ingredient.diluted_material != null) {
                    const name = ingredient.name + PN.getDilutionPercentString(ingredient);
                    this._nameMap[name] = ingredient.id;
                    elements.push(<option key={"dilution" + count} value={name}/>);
                } else {
                    this._nameMap[ingredient.name] = ingredient.id;
                    elements.push(<option key={"mixture" + count} value={ingredient.name}/>);
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

    _updateTooltip(id) {
        const material = PN.getMaterial(id);
        const mix = PN.getMixture(id);
        if (material != null) {
            this._tooltip = material.scent + "\n\n" + material.usage;
        } else if (mix != null) {
            const materials = PN.getMaterialsFromMixture(mix);
            this._tooltip = "";
            for (let material of materials) {
                this._tooltip = this._tooltip + material.scent + "\n\n" + material.usage + "\n\n-----\n\n";
            }
        }
    }

    render() {
        return (
            <div>
                {this._renderDataList()}
                <input list={this.props.id} 
                        className="ingredientpicker"
                        defaultValue={this._getDefaultValue()} 
                        tooltip={this._tooltip}
                        onChange={(event) => this._onChange(event.target.value)}/>
            </div>
        );
    }
}

IngredientPicker.defaultProps = {
    allowSolvents: false,
    allowMixtures: true,
    allowMaterials: true,
    id: 'ingredients',
    defaultValue: "",
    onChange: function(value){}
}