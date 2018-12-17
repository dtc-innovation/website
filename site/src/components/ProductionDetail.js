import React from 'react';
import {graphql} from 'gatsby';

export const queryFragment = graphql`
  fragment ProductionDetail on ProductionsJson {
    title {
      en
      fr
    }
    type
    description {
      en
      fr
    }
    content {
      en
      fr
    }
    activities {
      id
      name
    }
    people {
      id
      firstName
      lastName
    }
    productions {
      id
    }
    draft
  }
`;

export default function ProductionDetail({data}) {
  console.log(data);

  return (
    <div>
      <h1>Publication: {data.title.fr || data.title.en}</h1>
      {data.draft && <p><em>This is a draft.</em></p>}
      <hr />
      <p>
        <strong>Type</strong>: {data.type}
      </p>
      <hr />
      <p>
        <strong>EN title</strong>: {data.title && data.title.en}
      </p>
      <p>
        <strong>FR title</strong>: {data.title && data.title.fr}
      </p>
      <hr />
      <p>
        <strong>EN abstract</strong>: {data.abstract && data.abstract.en}
      </p>
      <p>
        <strong>FR abstract</strong>: {data.abstract && data.title.fr}
      </p>
      <hr />
      <div>
        Related activities:
        <ul>
          {(data.activities || []).map(a => <li key={a.id}>{a.name}</li>)}
        </ul>
      </div>
      <hr />
      <div>
        Related people:
        <ul>
          {(data.people || []).map(p => <li key={p.id}>{p.firstName} {p.lastName}</li>)}
        </ul>
      </div>
      <div>
        Related productions:
        <ul>
          {(data.productions || []).map(p => <li key={p.id}>{p.id}</li>)}
        </ul>
      </div>
      <hr />
      {data.content && data.content.en && <div dangerouslySetInnerHTML={{__html: data.content.en}} />}
      <hr />
      {data.content && data.content.fr && <div dangerouslySetInnerHTML={{__html: data.content.fr}} />}
    </div>
  );
}
