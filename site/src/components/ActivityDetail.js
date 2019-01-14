import React from 'react';
import {graphql} from 'gatsby';

import RawHtml from './RawHtml';

export const queryFragment = graphql`
  fragment ActivityDetail on ActivitiesJson {
    name
    type
    baseline {
      en
      fr
    }
    description {
      en
      fr
    }
    endDate
    type
    content {
      en
      fr
    }
    assets {
      base
      publicURL
    }
    people {
      id
      firstName
      lastName
    }
    active
    draft
  }
`;

export default function ActivityDetail({lang, data}) {
  console.log(lang, data);

  return (
    <main id="main-objet">
      <p class="titre-sticky">{data.name}</p>
      <article id="article-contenu">
        <hgroup>
          <h1>{data.name}{data.baseline && data.baseline.fr}</h1>
          <h2>{data.description && data.description.fr}</h2>

          <p class="date">{data.endDate}</p>
          <p class="type-objet">{data.type}</p>
          
        </hgroup>

        <div class="article-contenu">
        {data.content && data.content.fr && <RawHtml html={data.content.fr} />}
        </div>
      </article>

      <div>
        Related people:
        <ul>
          {(data.people || []).map(p => <li key={p.id}>{p.firstName} {p.lastName}</li>)}
        </ul>
      </div>

  </main>
  );
}

/*
Original 

<div>
      <h1>Activité: {data.name}</h1>
      {data.draft && <p><em>This is a draft.</em></p>}
      {data.active && <p><em>This activity is active.</em></p>}
      <p>
        <strong>Type</strong>: {data.type}
      </p>
      <hr />
      <p>
        <strong>EN baseline</strong>: {data.baseline && data.baseline.en}
      </p>
      <p>
        <strong>FR baseline</strong>: {data.baseline && data.baseline.fr}
      </p>
      <hr />
      <p>
        <strong>EN description</strong>: {data.description && data.description.en}
      </p>
      <p>
        <strong>FR description</strong>: {data.description && data.description.fr}
      </p>
      <hr />
      <div>
        Related people:
        <ul>
          {(data.people || []).map(p => <li key={p.id}>{p.firstName} {p.lastName}</li>)}
        </ul>
      </div>
      <hr />
      {data.content && data.content.en && <RawHtml html={data.content.en} />}
      <hr />
      {data.content && data.content.fr && <RawHtml html={data.content.fr} />}
    </div>

*/
