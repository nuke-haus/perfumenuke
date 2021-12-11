class DatabaseBody extends React.Component {

    state = {
        tableKey: "table"
    };

    _onChangeMaterial(key, value) {

    }

    _formatName(value) {
        return (value.toString().charAt(0).toUpperCase() + str.slice(1));
    }

    render() {
        return (
            <div>
                <div className="tabletext">
                    MATERIAL EDITOR
                </div>
                <table className="ingredienttable" key={this.state.tableKey}>
                    <tbody>
                        <tr>
                            <td>
                                ID: 
                                <input className="databaseinput" onChange={(event) => this._onChangeMaterial("id", event.target.value.toString().toLower())}/>
                            </td>
                            <td>
                                NAME: 
                                <input className="databaseinput" onChange={(event) => this._onChangeMaterial("name", this._formatName(event.target.value))}/>
                            </td>
                            <td>
                                COMPANY: 
                                <input className="databaseinput" onChange={(event) => this._onChangeMaterial("name", this._formatName(event.target.value))}/>
                            </td>
                        </tr>
                        <tr>
                            <td colSpan="3">
                                SCENT: 
                                <input className="databaseinput" onChange={(event) => this._onChangeMaterial("scent", this._formatName(event.target.value))}/>
                            </td>
                        </tr>
                        <tr>
                            <td colSpan="3">
                                USAGE: 
                                <input className="databaseinput" onChange={(event) => this._onChangeMaterial("usage", this._formatName(event.target.value))}/>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                NOTE: 
                                <select className="databaseinput" onChange={(event) => this._onChangeMaterial("note", event.target.value.toString().toLower())}>
                                    <option value="TOP">TOP</option>
                                    <option value="HEART">HEART</option>
                                    <option value="BASE">BASE</option>
                                </select>
                            </td>
                            <td>
                                LONGEVITY: 
                                <input className="databaseinput" onChange={(event) => this._onChangeMaterial("longevity", event.target.value)}/>
                            </td>
                            <td>
                                IMPACT: 
                                <input type="number" 
                                       min="0"
                                       onChange={(event) => this._onChangeMaterial("impact", event.target.value)}/>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                RECOMMENDED DILUTION: 
                                <input className="databaseinput" onChange={(event) => this._onChangeMaterial("dilute", event.target.value)}/>
                            </td>
                            <td>
                                AVERAGE % USED IN CONCENTRATE: 
                                <input type="number" 
                                       step="0.001" 
                                       min="0"
                                       onChange={(event) => this._onChangeMaterial("avg_in_concentrate", event.target.value)}/>
                            </td>
                            <td>
                                MAX % ADVISED IN CONCENTRATE: 
                                <input type="number" 
                                       step="0.001" 
                                       min="0"
                                       onChange={(event) => this._onChangeMaterial("max_in_concentrate", event.target.value)}/>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                CAS NUMBER: 
                                <input className="databaseinput" onChange={(event) => this._onChangeMaterial("cas", event.target.value.toString().toUpperCase())}/>
                            </td>
                            <td>
                                IFRA RESTRICTED: 
                                <select className="databaseinput" onChange={(event) => this._onChangeMaterial("ifra_restricted", event.target.value === "TRUE")}>
                                    <option value="TRUE">TRUE</option>
                                    <option value="FALSE">FALSE</option>
                                </select>
                            </td>
                            <td>
                                MAX % IN FINISHED PRODUCT: 
                                <input type="number" 
                                       step="0.001" 
                                       min="0"
                                       onChange={(event) => this._onChangeMaterial("max_in_finished_product", event.target.value)}/>
                            </td>
                        </tr>
                        <tr>
                            <td colSpan="3">
                                <button type="button" 
                                        onClick={() => this._createMaterial()}>
                                    Create Material
                                </button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        );
    }
}