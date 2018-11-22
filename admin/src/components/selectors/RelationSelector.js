import React, {Component} from 'react';
import Select from 'react-select';
import keyBy from 'lodash/keyBy';
import client from '../../client';

import labels from '../../../../specs/labels';

const noOptionsMessage = () => 'No matching people';

export default class RelationSelector extends Component {
  constructor(props, context) {
    super(props, context);

    this.optionsIndex = {};

    this.state = {
      loading: true,
      options: []
    };
  }

  componentDidMount() {
    client.list({params: {model: this.props.model}}, (err, data) => {

      const options = data
        .map(item => {
          return {
            value: item.id,
            label: labels[this.props.model](item)
          };
        });

      this.optionsIndex = keyBy(options, 'value');
      this.setState({options, loading: false});
    });
  }

  handleChange = (option) => {
    if (!option || !option.value)
      return;

    this.props.onAdd(option.value);
  };

  render() {
    const {options, loading} = this.state;

    const {onDrop, selected = []} = this.props;

    const selectedSet = new Set(selected);

    return (
      <div>
        {!loading && (
            selected.length ? (
                <ul>
                  {selected.map(id => {
                    return (
                      <li key={id}>
                        <span className="tag is-medium" style={{marginBottom: 3}}>
                          {this.optionsIndex[id].label}
                          &nbsp;<button className="delete is-small" onClick={() => onDrop(id)} />
                        </span>
                      </li>
                    );
                  })}
                </ul>
             ) : (
              <p><em>No items yet...</em></p>
            )
        )}
        <br />
        <Select
          value={null}
          onChange={this.handleChange}
          options={options.filter(o => !selectedSet.has(o.value))}
          isLoading={loading}
          menuPlacement="top"
          placeholder="Add..."
          noOptionsMessage={noOptionsMessage}
          styles={{menu: provided => ({...provided, zIndex: 1000})}} />
      </div>
    );
  }
}
