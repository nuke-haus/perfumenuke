class Page extends React.Component {

    NAV_FORMULA = "FORMULA";
    NAV_MATERIALS = "MATERIALS";
    NAV_MIXTURES = "MIXTURES";
    NAV_ABOUT = "ABOUT";

    state = {
        currentNav: "FORMULA"
    };

    _onNavClick(id) {
        this.setState({currentNav: id});
    }

    render() {

        const header = (
            <div>
                <div className="header">
                </div>
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
                    <div className="topbutton" onClick={() => this._onNavClick(this.NAV_ABOUT)}>
                        {this.NAV_ABOUT}
                    </div>
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
                {this.TEST1}
            </div>);

        } else if (this.state.currentNav == this.NAV_MIXTURES) { // MIXTURES DISPLAY

            return (<div>
                {header}
                {this.TEST2}
            </div>);

        } else { // ABOUT DISPLAY

            return (<div>
                {header}
                {this.TEST3}
            </div>);

        }
    }
}