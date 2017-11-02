import createRenderer from './createRenderer';
import { wrap } from './utils';
import marked from 'marked';
import {transform} from 'babel-standalone';

export function marksy (options = {}) {
  options.components = options.components || {};

  function CodeComponent (props) {
    return options.createElement('pre', null, options.createElement('code', {
      className: `language-${props.language}`,
      dangerouslySetInnerHTML: {__html: options.highlight ? options.highlight(props.language, props.code) : props.code}
    }))
  }

  const tracker = {
    tree: null,
    elements: null,
    nextElementId: null,
    toc: null,
    currentId: []
  };
  const renderer = createRenderer(tracker, options, {
    html (html) {
      try {
        const code = transform(html, {
          presets: ['react']
        }).code;
        const components = Object.keys(options.components).map(function (key) {
          return options.components[key];
        });
        const mockedReact = {createElement(tag, props = {}, ...children) {
          const componentProps = components.indexOf(tag) >= 0 ? Object.assign(props || {}, {key: tracker.nextElementId++, context: tracker.context}) : props;

          return options.createElement(tag, componentProps, children);
        }};

        tracker.tree.push(new Function('React', ...Object.keys(options.components), `return ${code}`)(mockedReact, ...components) || null);
      } catch (e) {}
    },
    code (code, language) {
      if (language === 'marksy') {
        return renderer.html(code)
      } else {
        const elementId = tracker.nextElementId++;

        tracker.elements[elementId] = options.createElement((options.elements && options.elements.code) || CodeComponent, {key: elementId, code, language});

        tracker.tree.push(tracker.elements[elementId]);

        return wrap(elementId, options.prefix, options.postfix);
      }
    }
  })

  return function compile (content, markedOptions = {}, context = {}) {
    tracker.tree = [];
    tracker.elements = {};
    tracker.toc = [];
    tracker.nextElementId = 0;
    tracker.context = context;
    tracker.currentId = [];
    marked(content, Object.assign({renderer: renderer, smartypants: true}, markedOptions));

    return {tree: tracker.tree, toc: tracker.toc};
  };
}


export default function (options) {
  return marksy(options)
};
