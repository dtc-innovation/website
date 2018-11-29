import React, {Component} from 'react';
import {Link} from 'react-router-dom';
import {push} from 'connected-react-router';
import {connect} from 'react-redux';
import cloneDeep from 'lodash/cloneDeep';
import set from 'lodash/fp/set';
import uuid from 'uuid/v4';
import {rawToHtml, htmlToRaw} from '../../utils';

import initializers from '../../../../specs/initializers';

import FormLayout from './FormLayout';
import Editor from '../Editor';
import EnumSelector from '../selectors/EnumSelector';
import BooleanSelector from '../selectors/BooleanSelector';
import Button from '../misc/Button';
import client from '../../client';

function extractData(scope) {
  const data = cloneDeep(scope.state.data);

  if (!data.bio)
    data.bio = {};

  if (scope.englishEditorContent)
    data.bio.en = rawToHtml(scope.englishEditorContent);

  if (scope.frenchEditorContent)
    data.bio.fr = rawToHtml(scope.frenchEditorContent);

  return data;
}

function createHandler(scope, key) {
  return e => {
    scope.setState(set(key, e.target.value, scope.state));
  };
}

function createRawHandler(scope, key) {
  return v => {
    scope.setState(set(key, v, scope.state));
  };
}

class PeopleForm extends Component {
  constructor(props, context) {
    super(props, context);

    this.frenchEditorContent = null;
    this.englishEditorContent = null;

    if (props.id) {
      this.state = {
        new: false,
        loading: true,
        data: null
      };
    }

    else {
      this.state = {
        new: true,
        loading: false,
        data: initializers.people(uuid)
      };
    }

    // Handlers
    this.handleFirstName = createHandler(this, ['data', 'firstName']);
    this.handleLastName = createHandler(this, ['data', 'lastName']);
    this.handleEnglishTitle = createHandler(this, ['data', 'title', 'en']);
    this.handleFrenchTitle = createHandler(this, ['data', 'title', 'fr']);
    this.handleMembership = createRawHandler(this, ['data', 'membership']);
  }

  componentDidMount() {

    if (!this.state.new)
      client.get({params: {model: 'people', id: this.props.id}}, (err, data) => {
        if (data.bio && data.bio.en) {
          data.bio.en = htmlToRaw(data.bio.en);
          this.englishEditorContent = data.bio.en;
        }

        if (data.bio && data.bio.fr) {
          data.bio.fr = htmlToRaw(data.bio.fr);
          this.frenchEditorContent = data.bio.fr;
        }

        this.setState({loading: false, data: data});
      });
  }

  handlePublished = value => {
    this.setState(set(['data', 'draft'], !value, this.state));
  };

  handleActive = value => {
    this.setState(set(['data', 'active'], value, this.state));
  };

  handleEnglishContent = content => {
    this.englishEditorContent = content;
  };

  handleFrenchContent = content => {
    this.frenchEditorContent = content;
  };

  handleSubmit = () => {
    const {push} = this.props;

    // TODO: validation here

    if (this.state.new) {

      // Creating the new item
      const payload = {
        params: {model: 'people'},
        data: extractData(this)
      };

      client.post(payload, (err, result) => {
        push(`/people/${this.state.data.id}`);
        this.setState({new: false});
      });
    }
    else {

      // Upating the item
      const payload = {
        params: {model: 'people', id: this.props.id},
        data: extractData(this)
      };

      client.put(payload, (err, result) => {
        // push('/people');
      });
    }
  };

  render() {

    const {
      loading,
      data
    } = this.state;

    if (loading)
      return <div>Loading...</div>;

    return (
      <FormLayout
        id={data.id}
        new={this.state.new}
        model="people"
        onSubmit={this.handleSubmit}>
        <div className="container">

          <div className="columns">
            <div className="column is-3">
              <div className="field">
                <label className="label">First Name</label>
                <div className="control">
                  <input
                    type="text"
                    className="input"
                    value={data.firstName}
                    onChange={this.handleFirstName}
                    placeholder="First Name" />
                </div>
              </div>
            </div>
          </div>

          <div className="columns">
            <div className="column is-3">
              <div className="field">
                <label className="label">Last Name</label>
                <div className="control">
                  <input
                    type="text"
                    className="input"
                    value={data.lastName}
                    onChange={this.handleLastName}
                    placeholder="Last Name" />
                </div>
              </div>
            </div>
          </div>

          <div className="columns">
            <div className="column is-2">
              <div className="field">
                <label className="label">Published?</label>
                <div className="control">
                  <BooleanSelector
                    value={!data.draft}
                    onChange={this.handlePublished} />
                </div>
              </div>
            </div>
          </div>

          <div className="columns">
            <div className="column is-2">
              <div className="field">
                <label className="label">Active?</label>
                <div className="control">
                  <BooleanSelector
                    value={data.active}
                    onChange={this.handleActive} />
                </div>
              </div>
            </div>
          </div>

          <div className="columns">
            <div className="column is-3">
              <div className="field">
                <label className="label">Membership</label>
                <div className="control">
                  <EnumSelector
                    enumType="membershipTypes"
                    value={data.membership}
                    onChange={this.handleMembership} />
                </div>
              </div>
            </div>
          </div>

          <div className="columns">

            <div className="column is-6">
              <div className="field">
                <label className="label">English Title</label>
                <div className="control">
                  <input
                    type="text"
                    className="input"
                    value={data.title ? data.title.en : ''}
                    onChange={this.handleEnglishTitle}
                    placeholder="English Title" />
                </div>
              </div>
            </div>

            <div className="column is-6">
              <div className="field">
                <label className="label">French Title</label>
                <div className="control">
                  <input
                    type="text"
                    className="input"
                    value={data.title ? data.title.fr : ''}
                    onChange={this.handleFrenchTitle}
                    placeholder="French Title" />
                </div>
              </div>
            </div>
          </div>

          <div className="columns">
            <div className="column is-6">
              <div className="field">
                <label className="label">English Biography</label>
                <Editor
                  rawContent={(data.bio && data.bio.en) || null}
                  onSave={this.handleEnglishContent} />
              </div>
            </div>

            <div className="column is-6">
              <div className="field">
                <label className="label">French Biography</label>
                <Editor
                  rawContent={(data.bio && data.bio.fr) || null}
                  onSave={this.handleFrenchContent} />
              </div>
            </div>
          </div>

        </div>
      </FormLayout>
    )
  }
}

const ConnectedPeopleForm = connect(
  null,
  {push}
)(PeopleForm);

export default ConnectedPeopleForm;
