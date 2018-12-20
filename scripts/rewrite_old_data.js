
const async = require('async');
const fs = require('fs-extra');
const path = require('path');
const uuid = require('uuid/v4');
const domains = require('./wordpress_scraping/domains.json');
const slug = require('slug');

const DEFAULT_MAX_SLUG_TOKENS = 6;
function slugify(str) {
  const s = slug(str, {lower: true});

  return s.split('-').slice(0, DEFAULT_MAX_SLUG_TOKENS).join('-');
}

function slugifyActivity(data) {
    return slugify(data.name);
  }
  function slugifyNews(data) {
    return slugify(data.title ? (data.title.fr || '') : '');
  }
  function slugifyPeople(data) {
    return slugify(`${data.firstName} ${data.lastName}`);
  }

// utils
// we might want to keep not only the slug but the path ?
const oldSlug = o => o.permalink.split('/')[o.permalink.split('/').length - 2];
const associated = status => status.indexOf('associ') !== -1;
const active = (o) => {
    if (!o.date_fin)
        return true;
    const [, , y] = o.date_fin.split('/');
    // simplified version of active counting anything which finish after january 2019
    return +y >= 19;
};
const formatDate = date => {
    const [y, m, d] = date.split('/').reverse();
    let ny = y;
    if (y.length === 2)
        ny = '20' + y;
    return `${ny}-${m}-${d}`;
};
// I am not proud of this
const mois = {
    janvier: '01',
    février: '02',
    mars: '03',
    avril: '04',
    mai: '05',
    juin: '06',
    juillet: '07',
    août: '08',
    septembre: '09',
    octobre: '10',
    novembre: '11',
    décembre: '12'
};

// code tools
const codeTools = ['sigma', 'sandcrawler', 'pygexf', 'issue2navicrawler', 'artoo'];
const deprecatedTools = ['sandcrawler', 'zup', 'manylines', 'anta', 'drive-in', 'issue2navicrawler', 'navicrawler', 'pygexf'];
const translations = {
    activities: (o, indices, reverseLinks) => {
        const name = o.title_fr.length > 0 ? o.title_fr : o.title_en;
        const newProject = {
            id: uuid(),
            lastUpdated: new Date(Date.parse(o.date)).getTime(),
            oldSlug: oldSlug(o),
            name,
            description: {
                en: o.excerpt_en,
                fr: o.excerpt_fr
            },
            type: 'research', // faudrait faire une classif
            content: {
                en: o.text_en,
                fr: o.text_fr
            },
            //people : faudra récupérer les liens des people
            // activities N/A
            important: false,
            active: active(o),
            draft: true
        };
        //const dateDebut = o.custom_fields.filter(e => e.date_debut).reduce((acc, e) => e.date_debut, null);

        if (o.sstitre_projet_fr)
            newProject.baseline = {fr: o.sstitre_projet_fr};
        if (o.sstitre_projet_en)
            Object.assign(newProject.baseline, {en: o.sstitre_projet_en});
        if (o.date_debut)
            newProject.startDate = formatDate(o.date_debut);
        if (o.date_fin)
            newProject.endDate = formatDate(o.date_fin);

        //slug
        newProject.slug = [slugifyActivity(newProject)];

        // links from people
        if (reverseLinks['activities->people'][newProject.oldSlug])
            newProject.people = reverseLinks['activities->people'][newProject.oldSlug];

        return {newO: newProject, reverseLinks: {}};
    },
    people: people => {
        const name = people.title_fr.length > 0 ? people.title_fr : people.title_en;
        const newPeople = {
            id: uuid(),
            lastUpdated: new Date(Date.parse(people.date)).getTime(),
            oldId: people._id,
            oldSlug: oldSlug(people),
            firstName: name.split(' ')[0],
            lastName: name.split(' ').slice(1).join(' '),
            role: {
                en: people.excerpt_en,
                fr: people.excerpt_fr
            },
            domain: domains[oldSlug(people)],
            //status N/A
            bio: {
                en: people.text_en,
                fr: people.text_fr
            },
            // contact N/A
            membership: associated(people.excerpt_fr) ? 'associate' : 'member',
            // mainActivities / Productions N/A
            active: active(people),
            draft: true,
            // spire N/A
            // ldap N/A
        };

        newPeople.slugs = [slugifyPeople(newPeople)];

        return {newO: newPeople, reverseLinks: {activities: people.projets, productions: people.tools}};
    },
    news: (o, indeces) => {
        const name = o.title_fr.length > 0 ? o.title_fr : o.title_en;
        const newNews = {
            id: uuid(),
            oldId: o._id,
            lastUpdated: new Date(Date.parse(o.date)).getTime(),
            oldSlug: oldSlug(o),
            name,
            description: {
                en: o.excerpt_en,
                fr: o.excerpt_fr
            },
            type: 'notice', //default which can be changed below
            title: {
                en: o.title_en,
                fr: o.title_fr
            },
            content: {
                en: o.text_en,
                fr: o.text_fr
            },
            // place N/A
            //people : faudra récupérer les liens des people
            // activities N/A
            internal: false,
            active: active(o),
            draft: true
        };

        // séminaire => type = event
        if ((o.news_type_fr && o.news_type_fr.match(/s[ée]minaire/i)) ||
            (o.title_fr && o.title_fr.match(/s[ée]minaire/i)) ||
            (o.title_en && o.title_en.match(/seminar/i))) {
            newNews.type = 'event';
            newNews.internal = true;
            // date : copy writing date
            if (o.date_debut_fr) {
                const groups = o.date_debut_fr.match(/\w+ (\d{1,2}) ([\wé]*) ?(\d{4})?/u);
                if (groups) {
                    const y = !!groups[3] ? groups[3] : new Date(Date.parse(o.date)).getFullYear();
                    newNews.startDate = `${y}-${mois[groups[2]]}-${groups[1].length === 1 ? '0' : ''}${groups[1]}`;
                }
            }
        }
        if (!newNews.startDate) {
            // use the last updated date as fallback
            const approxDate = new Date(Date.parse(o.date));
            let m = (approxDate.getMonth() + 1) + '';
            m = m.length === 1 ? '0' + m : m;
            let d = approxDate.getDate();
            d = d.lenght === 1 ? '0' + d : d;
            newNews.startDate = `${approxDate.getFullYear()}-${m}-${d}`;
        }
        // label
        if (o.news_type_fr)
            newNews.label = {fr: o.news_type_fr};
        if (o.sstitre_projet_en)
            Object.assign(newNews.label, {en: o.sstitre_projet_en});

        newNews.slugs = [slugifyNews(newNews)];

        // links
        newNews.people = o.people.map(p => indeces.people[p]);
        newNews.people = o.projets.map(p => indeces.activities[p]);
        //newNews.productions = o.tools.map(p => indeces.productions[p]);
        return {newO: newNews, reverseLinks: {}};
    },
    productions: (o, indeces, reverseLinks) => {
        const newProduction = {
            id: uuid(),
            lastUpdated: new Date().getTime(),
            oldSlug: o.oldSlug,
            title: {
                en: o.name,
                fr: o.name
            },
            description: {
                en: o.description || o.description_en,
                fr: o.description_fr || ''
            },
            authors: o.authors.join(', '),
            type: codeTools.indexOf(o.oldSlug) === -1 ? 'software' : 'code',
            active: deprecatedTools.indexOf(o.oldSlug) === -1,
            draft: true,
            url: o.url || o.url_dev || o.url_source
        };

        //slug
        newProduction.slugs = [slugifyNews(newProduction)];

        // links from people
        // todo: do union with authors from meta.json
        if (reverseLinks['productions->people'][newProduction.oldSlug])
            newProduction.people = reverseLinks['productions->people'][newProduction.oldSlug];

        return {newO: newProduction, reverseLinks: {}};
    }
};


function processObjects(oldModel, newModel, indices, olinks, done) {
        const inPath = `./wordpress_scraping/data/${oldModel}/`;
        const outPath = `./wordpress_scraping/data/new/${newModel}`;
        fs.removeSync(outPath);
        fs.ensureDirSync(outPath);
        const index = {};
        const newLinks = olinks ? olinks : [];
        async.each(fs.readdirSync(inPath), (f, localDone) => {
            const o = fs.readJsonSync(path.join(inPath, f), 'utf8');
            // patch
            if (oldModel === 'tools') {
                // récupération du slug
                o.oldSlug = f.split('.')[0];
            }

            const {newO, reverseLinks} = translations[newModel](o, indices, olinks);
            index[newO.oldSlug] = newO.id;
            for (const sourceModel in reverseLinks) {
                if (!newLinks[`${sourceModel}->${newModel}`])
                    newLinks[`${sourceModel}->${newModel}`] = {};
                reverseLinks[sourceModel].forEach(slugO => {
                    if (!newLinks[`${sourceModel}->${newModel}`][slugO])
                        newLinks[`${sourceModel}->${newModel}`][slugO] = [];
                    newLinks[`${sourceModel}->${newModel}`][slugO].push(newO.id);
                });
            }

            if (o._id !== 1063) {
               // writting
                fs.writeJsonSync(path.join(outPath, `${newO.id}.json`), newO, {spaces: 2, encoding: 'utf8'});
            }
            localDone(null);
        }, (err) => {
            console.log(`done with ${newModel}`);
            if (err) throw err;
            indices[newModel] = index;
            done(null, indices, newLinks);
        });
}


async.waterfall([
    // first people
    (done) => {
        processObjects('people', 'people', {}, {}, done);
    },
    //activity
    (indeces, links, done) => {
        processObjects('projets', 'activities', indeces, links, done);
    },
    //tools -> productions
    (indeces, links, done) => {
        processObjects('tools', 'productions', indeces, links, done);
    },
    //news
    (indeces, links, done) => {
        processObjects('blogs', 'news', indeces, links, done);
    }

]);
