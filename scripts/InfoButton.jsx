class InfoButton extends React.Component {

    state = {
        showModal: false
    }

    constructor(props) {
        super(props);
    }

    _onClick(show) {
        this.setState({showModal: show});
    }

    _renderModal() {
        if (this.state.showModal) {
            return (
                <div className="modal">
                    test
                    <button type="button" 
                            onClick={() => this._onClick(false)}>
                        Close
                    </button>
                </div>
            );
        }
        return null;
    }

    render() {
        return (
            <div className="infobutton">
                <span>
                    {this.props.material.name || "NO NAME"}
                </span>
                <span onClick={() => this._onClick(true)}>
                    {'\u{2139}'}
                </span>
                {this._renderModal()}
            </div>
        );
    }
}

InfoButton.defaultProps = {
    material: {}
}