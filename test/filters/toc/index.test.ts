import {expect} from 'chai';

import {renderNode, renderChildren, toc} from '../../../filters/toc';

const titles: string[] = [
  'The Adventures of Huckleberry Finn',
  'Personal Recollections of Joan of Arc',
  "A Connecticut Yankee in King Arthur's Court",
  'The Mysterious Stranger and Other Stories',
  'The Celebrated Jumping Frog of Calaveras County',
  'The Adventures of Tom Sawyer',
  'A Tramp Abroad',
  'The Prince and the Pauper',
];

describe('filters/toc.js Tests:', () => {
  describe('renderNode() Tests:', () => {
    it('renderNode() creates `li` with `span` of just the title', () => {
      const title = titles[2];
      const sample = renderNode({title});
      document.body.innerHTML = sample;
      const li = document.body.firstElementChild as HTMLLIElement;
      const span = li.firstElementChild as HTMLSpanElement;

      expect(document.body.children.length).to.equal(1);
      expect(li.tagName).to.equal('LI');
      expect(li.children.length).to.equal(1);
      expect(span.tagName).to.equal('SPAN');
      expect(span.innerHTML).to.equal(title);
    });

    it('renderNode() creates `li` with `a` if there is an `id`', () => {
      const title = titles[2];
      const id = 'mark-twain';
      const sample = renderNode({title, id});
      document.body.innerHTML = sample;
      const li = document.body.firstElementChild as HTMLLIElement;
      const a = li.firstElementChild as HTMLAnchorElement;

      expect(document.body.children.length).to.equal(1);
      expect(li.tagName).to.equal('LI');
      expect(li.children.length).to.equal(1);
      expect(a.tagName).to.equal('A');
      expect(a.innerHTML).to.equal(title);
      expect(a.getAttribute('href')).to.equal(`#${id}`);
    });

    it('renderNode() creates `li` with children', () => {
      const title = titles[2];
      const sample = renderNode({
        title,
        children: titles.map(title => ({title})),
      });
      document.body.innerHTML = sample;
      const li = document.body.firstElementChild as HTMLLIElement;
      const ul = li.children.item(1) as HTMLUListElement;

      expect(document.body.children.length).to.equal(1);
      expect(li.tagName).to.equal('LI');
      expect(li.children.length).to.equal(2);
      expect(ul.tagName).to.equal('UL');
      expect(ul.children.length).to.equal(titles.length);
    });
  });

  describe('renderChildren() Tests:', () => {
    it('renderChildren() creates `ul` with children', () => {
      const sample = renderChildren(titles.map(title => ({title})));
      document.body.innerHTML = sample;
      const ul = document.body.firstElementChild as HTMLUListElement;

      expect(document.body.children.length).to.equal(1);
      expect(ul.tagName).to.equal('UL');
      expect(ul.children.length).to.equal(titles.length);
    });

    it('renderChildren() creates `ul` with no children if nothing provided', () => {
      const sample = renderChildren([]);
      document.body.innerHTML = sample;
      const ul = document.body.firstElementChild as HTMLUListElement;

      expect(document.body.children.length).to.equal(1);
      expect(ul.tagName).to.equal('UL');
      expect(ul.children.length).to.equal(0);
    });
  });

  describe('toc() Tests:', () => {
    it("toc() creates table of contents with only `h2`'s with id's", () => {
      // Every other title will be a h2, so only half the titles will be in the toc
      const sample = toc(
        titles
          .map(
            (title, i) =>
              `<${i % 2 === 0 ? 'h2' : 'h4'} id="${title}">${title}</${
                i % 2 === 0 ? 'h2' : 'h4'
              }>`
          )
          .join('')
      );

      document.body.innerHTML = sample;
      const ul = document.body.firstElementChild as HTMLUListElement;
      const lis = Array.from(ul.children);

      expect(document.body.children.length).to.equal(1);
      expect(ul.tagName).to.equal('UL');
      expect(ul.children.length).to.equal(titles.length / 2);
      for (let i = 0; i < lis.length; i++) {
        const li = lis[i];
        const title = titles[i * 2];
        const a = li.firstElementChild as HTMLAnchorElement;
        expect(li.tagName).to.equal('LI');
        expect(li.children.length).to.equal(1);

        expect(a.tagName).to.equal('A');
        expect(a.innerHTML).to.equal(title);
      }
    });

    it('toc() ignores all headers before `h2`', () => {
      // Only the last element will be an h2
      const sample = toc(
        titles
          .map(
            (title, i) =>
              `<${
                i + 1 === titles.length ? 'h2' : 'h3'
              } id="${title}">${title}</${
                i + 1 === titles.length ? 'h2' : 'h3'
              }>`
          )
          .join('')
      );

      document.body.innerHTML = sample;
      const ul = document.body.firstElementChild as HTMLUListElement;

      expect(document.body.children.length).to.equal(1);
      expect(ul.tagName).to.equal('UL');
      expect(ul.children.length).to.equal(1);
    });

    it("toc() ignores all headers without id's", () => {
      // Only the last element will be an h2
      const sample = toc(
        titles
          .map(
            (title, i) =>
              `<h2 ${i % 2 === 0 ? `id="${title}"` : ''}>${title}</h2>`
          )
          .join('')
      );

      document.body.innerHTML = sample;
      const ul = document.body.firstElementChild as HTMLUListElement;
      const lis = Array.from(ul.children);

      expect(document.body.children.length).to.equal(1);
      expect(ul.tagName).to.equal('UL');
      expect(ul.children.length).to.equal(titles.length / 2);
      for (let i = 0; i < lis.length; i++) {
        const li = lis[i];
        const title = titles[i * 2];
        const a = li.firstElementChild as HTMLAnchorElement;
        expect(li.tagName).to.equal('LI');
        expect(li.children.length).to.equal(1);

        expect(a.tagName).to.equal('A');
        expect(a.innerHTML).to.equal(title);
      }
    });

    it("toc() puts h3's as children of h2's", () => {
      // Only the last element will be an h2
      const headers = [
        `<h2 id="${titles[0]}">${titles[0]}</h2>`,
        ...titles.map(title => `<h3 id="${title}">${title}</h3>`),
      ];
      const sample = toc(headers.join(''));

      document.body.innerHTML = sample;
      const ul = document.body.firstElementChild as HTMLUListElement;
      const h2Li = ul.firstElementChild as HTMLLIElement;
      const embeddedUl = h2Li.children.item(1) as HTMLUListElement;

      expect(document.body.children.length).to.equal(1);
      expect(ul.tagName).to.equal('UL');
      expect(ul.children.length).to.equal(1);
      expect(h2Li.tagName).to.equal('LI');
      expect(h2Li.children.length).to.equal(2);
      expect(embeddedUl.tagName).to.equal('UL');
      expect(embeddedUl.children.length).to.equal(titles.length);
    });

    it('toc() uses options', () => {
      /** @typedef {import('types').TocOptions} */
      const options = {
        listClass: 'list',
        listItemClass: 'listitem',
        anchorClass: 'anchor',
        spanClass: 'span',
      };

      const sample = toc(`<h2 id="${titles[0]}">${titles[0]}</h2>`, options);

      document.body.innerHTML = sample;
      const ul = document.body.firstElementChild as HTMLUListElement;
      const li = ul.firstElementChild as HTMLLIElement;
      const a = li.firstElementChild as HTMLAnchorElement;

      expect(document.body.children.length).to.equal(1);
      expect(ul.tagName).to.equal('UL');
      expect(ul.children.length).to.equal(1);
      expect(ul.classList.toString()).to.equal(options.listClass);
      expect(li.tagName).to.equal('LI');
      expect(li.children.length).to.equal(1);
      expect(li.classList.toString()).to.equal(options.listItemClass);
      expect(a.tagName).to.equal('A');
      expect(a.classList.toString()).to.equal(options.anchorClass);
    });
  });
});
