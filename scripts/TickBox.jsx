class TickBox extends React.Component {

    constructor(props) {
        super(props);
    }

    _onClick(ticked) {
        this.props.onClick(ticked);
    }

    render() {
        return this.props.ticked === true
            ? (
                <div>
                    {this.props.label}
                    <div className="tickboxselected"
                        onClick={() => this._onClick(false)}/>
                </div>
            )
            : (
                <div>
                    {this.props.label}
                    <div className="tickboxdeselected"
                        onClick={() => this._onClick(true)}/>
                </div>
            );
    }
}

TickBox.defaultProps = {
    ticked: false,
    onClick: () => {}
}