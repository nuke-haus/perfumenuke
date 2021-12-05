class Page extends React.Component {

    NAV_FORMULA = "FORMULA";
    NAV_MATERIALS = "MATERIALS";
    NAV_MIXTURES = "MIXTURES";
    NAV_ERRORS = "ERRORS"

    state = {
        currentNav: "FORMULA"
    };

    _onNavClick(id) {
        this.setState({currentNav: id});
    }

    render() {

        let errorsTab = null;
        let errors = null;
        let warnings = null;
        let table = null;
        if (PN.warnings.length > 0 || PN.errors.length > 0) {
            errorsTab = (
                <div className="topbutton error" onClick={() => this._onNavClick(this.NAV_ERRORS)}>
                    {this.NAV_ERRORS}
                </div>
            );
            
            errors = [];
            warnings = [];
            for (let warning of PN.warnings) {
                warnings.push(
                    <tr>
                        <td>
                            <span className="warning">WARNING:</span>
                        </td>
                        <td>
                            {warning}
                        </td>
                    </tr>
                );
            }
            for (let error of PN.errors) {
                errors.push(
                    <tr>
                        <td>
                            <span className="error">ERROR:</span>
                        </td>
                        <td>
                            {error}
                        </td>
                    </tr>
                );
            }
            table = (
                <table>
                    <tr>
                        <th/>
                        <th/>
                    </tr>
                    {errors}
                    {warnings}
                </table>
            );
        }

        const header = (
            <div>
                <div className="navbar">
                    <div className="topbutton" onClick={() => this._onNavClick(this.NAV_FORMULA)}>
                        {this.NAV_FORMULA}
                    </div>
                    <div className="topbutton" onClick={() => this._onNavClick(this.NAV_MATERIALS)}>
                        {this.NAV_MATERIALS}
                    </div>
                    <div className="topbutton" onClick={() => this._onNavClick(this.NAV_MIXTURES)}>
                        {this.NAV_MIXTURES}
                    </div>
                    {errorsTab}
                </div>
                <div className="bar">
                </div>
                <div className="barshadow">
                </div>
            </div>
        );

        if (this.state.currentNav == this.NAV_FORMULA) { // FORMULA DISPLAY

            return (<div>
                {header}
                <FormulaBody/>
            </div>);

        } else if (this.state.currentNav == this.NAV_MATERIALS) { // MATERIALS DISPLAY

            return (<div>
                {header}
                <DatabaseBody/>
            </div>);

        } else if (this.state.currentNav == this.NAV_MIXTURES) { // MIXTURES DISPLAY

            return (<div>
                {header}
                <DatabaseBody/>
            </div>);

        } else if (this.state.currentNav == this.NAV_ERRORS) { // ERRORS DISPLAY

            return (<div>
                {header}
                {table}
            </div>);

        } 

        return null;
    }
}