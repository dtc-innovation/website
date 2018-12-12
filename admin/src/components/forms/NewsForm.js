import React, {Component} from 'react';
import {push as pushAction} from 'connected-react-router';
import {connect} from 'react-redux';
import set from 'lodash/fp/set';
import uuid from 'uuid/v4';
import {slugify} from '../../utils';

import initializers from '../../../../specs/initializers';

import FormLayout from './FormLayout';
import Editor from '../Editor';
import BooleanSelector from '../selectors/BooleanSelector';
import RelationSelector from '../selectors/RelationSelector';
import SuggestionSelector from '../selectors/SuggestionSelector';
import {
  createHandler,
  createSlugRelatedHandler,
  createAddRelationHandler,
  createDropRelationHandler,
  createRawHandler
} from './utils';
import client from '../../client';

function slugForModel(data) {
  return slugify(data.id, data.title ? (data.title.fr || '') : '');
}

function validate(data) {
  if (!data.title || !data.title.fr)
    return 'Need at least a French title';
}

class NewsForm extends Component {
  constructor(props, context) {
    super(props, context);

    this.frenchEditorContent = null;
    this.englishEditorContent = null;

    if (props.id) {
      this.state = {
        existingSlugs: null,
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
    this.handleFrenchTitle = createSlugRelatedHandler(this, ['data', 'title', 'fr'], slugForModel);
    this.handleEnglishExcerpt = createHandler(this, ['data', 'excerpt', 'en']);
    this.handleFrenchExcerpt = createHandler(this, ['data', 'excerpt', 'fr']);
    this.handleEnglishLabel = createRawHandler(this, ['data', 'label', 'en']);
    this.handleFrenchLabel = createRawHandler(this, ['data', 'label', 'fr']);

    this.handleAddActivity = createAddRelationHandler(this, 'activities');
    this.handleDropActivity = createDropRelationHandler(this, 'activities');
    this.handleAddPeople = createAddRelationHandler(this, 'people');
    this.handleDropPeople = createDropRelationHandler(this, 'people');
    this.handleAddPublication = createAddRelationHandler(this, 'publications');
    this.handleDropPublication = createDropRelationHandler(this, 'publications');

    this.handleFrenchContent = createRawHandler(this, ['data', 'content', 'fr']);
    this.handleEnglishContent = createRawHandler(this, ['data', 'content', 'en']);
  }

  componentDidMount() {

    if (!this.state.new)
      client.get({params: {model: 'news', id: this.props.id}}, (err, data) => {
        if (data.content && data.content.en)
          this.englishEditorContent = data.content.en;

        if (data.content && data.content.fr)
          this.frenchEditorContent = data.content.fr;

        this.setState({loading: false, data});
      });

    client.suggest({params: {model: 'news', field: 'slugs'}}, (err, data) => {
      this.setState({existingSlugs: new Set(data)});
    });
  }

  handlePublished = value => {
    this.setState(set(['data', 'draft'], !value, this.state));
  };

  handleSubmit = newSlug => {
    const {push} = this.props;

    let state = this.state;

    if (newSlug) {
      state = set(['data', 'slugs'], [newSlug], state);
      this.setState(state);
    }

    if (state.new) {

      // Creating the new item
      const payload = {
        params: {model: 'news'},
        data: state.data
      };

      client.post(payload, () => {
        push(`/news/${state.data.id}`);
        this.setState({new: false});
      });
    }
    else {

      // Upating the item
      const payload = {
        params: {model: 'news', id: this.props.id},
        data: state.data
      };

      client.put(payload, () => {
        // push('/news');
      });
    }
  };

  render() {

    const {
      existingSlugs,
      loading,
      data
    } = this.state;

    if (loading)
      return <div>Loading...</div>;

    const slugValue = this.state.new ?
      slugForModel(data) :
      data.slugs[data.slugs.length - 1];

    const collidingSlug = (
      this.state.new &&
      existingSlugs &&
      existingSlugs.has(slugValue)
    );

    return (
      <FormLayout
        data={data}
        new={this.state.new}
        model="news"
        collidingSlug={collidingSlug}
        existingSlugs={existingSlugs}
        validate={validate}
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
                      autoFocus
                      value={(data.title && data.title.en) || ''}
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
                      value={(data.title && data.title.fr) || ''}
                      onChange={this.handleFrenchTitle}
                      placeholder="French Title" />
                  </div>
                </div>
              </div>
            </div>

            <div className="columns">
              <div className="column is-6">
                <div className="field">
                  <label className="label">Slug</label>
                  <div className="control">
                    <input
                      type="text"
                      className={collidingSlug ? 'input is-danger' : 'input'}
                      value={slugValue}
                      disabled
                      placeholder="..." />
                  </div>
                  {collidingSlug && <p className="help is-danger">This slug already exists!</p>}
                </div>
              </div>
            </div>

            <div className="columns">
              <div className="column is-6">
                <div className="field">
                  <label className="label">English Excerpt</label>
                  <div className="control">
                    <textarea
                      className="textarea"
                      value={(data.excerpt && data.excerpt.en) || ''}
                      onChange={this.handleEnglishExcerpt}
                      placeholder="English Excerpt"
                      rows={2} />
                  </div>
                </div>
              </div>

              <div className="column is-6">
                <div className="field">
                  <label className="label">French Excerpt</label>
                  <div className="control">
                    <textarea
                      className="textarea"
                      value={(data.excerpt && data.excerpt.fr) || ''}
                      onChange={this.handleFrenchExcerpt}
                      placeholder="French Excerpt"
                      rows={2} />
                  </div>
                </div>
              </div>
            </div>

            <div className="columns">
              <div className="column is-6">
                <div className="field">
                  <label className="label">English Label</label>
                  <SuggestionSelector
                    model="news"
                    field={['label', 'en']}
                    placeholder="English label..."
                    onChange={this.handleEnglishLabel}
                    value={(data.label && data.label.en) || null} />
                </div>
              </div>

              <div className="column is-6">
                <div className="field">
                  <label className="label">French Label</label>
                  <SuggestionSelector
                    model="news"
                    field={['label', 'fr']}
                    placeholder="French label..."
                    onChange={this.handleFrenchLabel}
                    value={(data.label && data.label.fr) || null} />
                </div>
              </div>
            </div>
          </div>

          <div className="form-group">
            <h4 className="title is-4">
              News contents
            </h4>
            <div className="columns">
              <div className="column is-6">
                <div className="field">
                  <label className="label">English Content</label>
                  <Editor
                    content={this.englishEditorContent}
                    onSave={this.handleEnglishContent} />
                </div>
              </div>

              <div className="column is-6">
                <div className="field">
                  <label className="label">French Content</label>
                  <Editor
                    content={this.frenchEditorContent}
                    onSave={this.handleFrenchContent} />
                </div>
              </div>
            </div>
          </div>


          <div className="form-group">
            <h4 className="title is-4">
              Related objects
            </h4>
            <div className="columns">
              <div className="column is-12">
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
              <div className="column is-12">
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
              <div className="column is-12">
                <div className="field">
                  <label className="label">Related Publications</label>
                  <div className="control">
                    <RelationSelector
                      model="publications"
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
              <label className="label title is-4">News publication status</label>
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
    );
  }
}

const ConnectedNewsForm = connect(
  null,
  {push: pushAction}
)(NewsForm);

export default ConnectedNewsForm;
