import React, {Component} from 'react';
import {Link} from 'react-router-dom';
import {push} from 'connected-react-router';
import {connect} from 'react-redux';
import cloneDeep from 'lodash/cloneDeep';
import set from 'lodash/fp/set';
import get from 'lodash/get';
import uuid from 'uuid/v4';
import {rawToHtml, htmlToRaw} from '../../utils';

import initializers from '../../../../specs/initializers';

import FormLayout from './FormLayout';
import Editor from '../Editor';
import Button from '../misc/Button';
import BooleanSelector from '../selectors/BooleanSelector';
import EnumSelector from '../selectors/EnumSelector';
import RelationSelector from '../selectors/RelationSelector';
import client from '../../client';

function extractData(scope) {
  const data = cloneDeep(scope.state.data);

  if (!data.content)
    data.content = {};

  if (scope.englishEditorContent)
    data.content.en = rawToHtml(scope.englishEditorContent);

  if (scope.frenchEditorContent)
    data.content.fr = rawToHtml(scope.frenchEditorContent);

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

function createAddRelationHandler(scope, key) {
  return id => {
    const data = get(scope.state.data, key, []);

    data.push(id);

    scope.setState(set(['data', key], data, scope.state));
  };
}

function createDropRelationHandler(scope, key) {
  return id => {
    let data = get(scope.state.data, key, []);

    data = data.filter(i => i !== id);

    scope.setState(set(['data', key], data, scope.state));
  };
}

class PublicationFrom extends Component {
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
        data: initializers.activity(uuid)
      };
    }

    // Handlers
    this.handleEnglishTitle = createHandler(this, ['data', 'title', 'en']);
    this.handleFrenchTitle = createHandler(this, ['data', 'title', 'fr']);
    this.handleEnglishAbstract = createHandler(this, ['data', 'abstract', 'en']);
    this.handleFrenchAbstract = createHandler(this, ['data', 'abstract', 'fr']);
    this.handleType = createRawHandler(this, ['data', 'type']);

    this.handleAddActivity = createAddRelationHandler(this, 'activities');
    this.handleDropActivity = createDropRelationHandler(this, 'activities');
    this.handleAddPeople = createAddRelationHandler(this, 'people');
    this.handleDropPeople = createDropRelationHandler(this, 'people');
    this.handleAddPublication = createAddRelationHandler(this, 'publications');
    this.handleDropPublication = createDropRelationHandler(this, 'publications');
  }

  componentDidMount() {

    if (!this.state.new)
      client.get({params: {model: 'publications', id: this.props.id}}, (err, data) => {
        if (data.content && data.content.en) {
          data.content.en = htmlToRaw(data.content.en);
          this.englishEditorContent = data.content.en;
        }

        if (data.content && data.content.fr) {
          data.content.fr = htmlToRaw(data.content.fr);
          this.frenchEditorContent = data.content.fr;
        }

        this.setState({loading: false, data: data});
      });
  }

  handlePublished = value => {
    this.setState(set(['data', 'draft'], !value, this.state));
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
        params: {model: 'publications'},
        data: extractData(this)
      };

      client.post(payload, (err, result) => {
        push(`/publications/${this.state.data.id}`);
        this.setState({new: false});
      });
    }
    else {

      // Upating the item
      const payload = {
        params: {model: 'publications', id: this.props.id},
        data: extractData(this)
      };

      client.put(payload, (err, result) => {
        // push('/publications');
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
        model="publications"
        label="publication"
        onSubmit={this.handleSubmit}>
        <div className="container">
          
          <div className="form-group">
            <div className="columns">
              <div className="column is-6">
                <div className="field">
                  <label className="label">English Title</label>
                  <div className="control">
                    <input
                      type="text"
                      className="input"
                      value={data.title.en}
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
                      value={data.title.fr}
                      onChange={this.handleFrenchTitle}
                      placeholder="French Title" />
                  </div>
                </div>
              </div>
            </div>
            <div className="columns">
              <div className="column is-6">
                <div className="field">
                  <label className="label">Type of publication</label>
                  <div className="control">
                    <EnumSelector
                      enumType="publicationTypes"
                      value={data.type}
                      onChange={this.handleType} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="form-group">
            <h4 className="title is-4">
              Publication presentation
            </h4>
            <div className="columns">
              <div className="column is-6">
                <div className="field">
                  <label className="label">English Abstract</label>
                  <div className="control">
                    <textarea
                      className="textarea"
                      value={(data.abstract && data.abstract.en) || ''}
                      onChange={this.handleEnglishAbstract}
                      placeholder="English Abstract"
                      rows={2} />
                  </div>
                </div>
              </div>

              <div className="column is-6">
                <div className="field">
                  <label className="label">French Abstract</label>
                  <div className="control">
                    <textarea
                      className="textarea"
                      value={(data.abstract && data.abstract.fr) || ''}
                      onChange={this.handleFrenchAbstract}
                      placeholder="French Abstract"
                      rows={2} />
                  </div>
                </div>
              </div>
            </div>

            <div className="columns">
              <div className="column is-6">
                <div className="field">
                  <label className="label">English Content</label>
                  <Editor
                    rawContent={(data.content && data.content.en) || null}
                    onSave={this.handleEnglishContent} />
                </div>
              </div>

              <div className="column is-6">
                <div className="field">
                  <label className="label">French Content</label>
                  <Editor
                    rawContent={(data.content && data.content.fr) || null}
                    onSave={this.handleFrenchContent} />
                </div>
              </div>
            </div>
          </div>

          <div className="form-group">
            <h4 className="title is-4">
              Publication's related objects
            </h4>

            <div className="columns">
              <div className="column is-6">
                <div className="field">
                  <label className="label">Related Activities</label>
                  <div className="control">
                    <RelationSelector
                      model="activities"
                      selected={data.activities}
                      onAdd={this.handleAddActivity}
                      onDrop={this.handleDropActivity} />
                  </div>
                </div>
              </div>
            </div>

            <div className="columns">
              <div className="column is-6">
                <div className="field">
                  <label className="label">Related People</label>
                  <div className="control">
                    <RelationSelector
                      model="people"
                      selected={data.people}
                      onAdd={this.handleAddPeople}
                      onDrop={this.handleDropPeople} />
                  </div>
                </div>
              </div>
            </div>

            <div className="columns">
              <div className="column is-6">
                <div className="field">
                  <label className="label">Related Publications</label>
                  <div className="control">
                    <RelationSelector
                      model="publications"
                      self={data.id}
                      selected={data.publications}
                      onAdd={this.handleAddPublication}
                      onDrop={this.handleDropPublication} />
                  </div>
                </div>
              </div>
            </div>

          </div>

          <div className="form-group is-important">
            <div className="field">
              <label className="label title is-4">{'"' + data.title.en + '"' || 'Publication'} page's publication status</label>
              <div className="control">
                <BooleanSelector
                  value={!data.draft}
                  labels={['published', 'draft']}
                  onChange={this.handlePublished} />
              </div>
            </div>
          </div>

        </div>
      </FormLayout>
    )
  }
}

const ConnectedPublicationFrom = connect(
  null,
  {push}
)(PublicationFrom);

export default ConnectedPublicationFrom;
