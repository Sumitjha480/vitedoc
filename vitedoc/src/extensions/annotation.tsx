import { Mark, mergeAttributes } from '@tiptap/core';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    annotation: {
      setAnnotation: (comment: string) => ReturnType;
      unsetAnnotation: () => ReturnType;
    };
  }
}

export const Annotation = Mark.create({
  name: 'annotation',

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      comment: {
        default: null,
        parseHTML: element => element.getAttribute('data-comment'),
        renderHTML: attributes => {
          return {
            'data-comment': attributes.comment,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-annotation]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(
      this.options.HTMLAttributes,
      HTMLAttributes,
      { class: 'annotation bg-yellow-100 cursor-help' }
    ), 0];
  },

  addCommands() {
    return {
      setAnnotation: comment => ({ commands }) => {
        return commands.setMark(this.name, { comment });
      },
      unsetAnnotation: () => ({ commands }) => {
        return commands.unsetMark(this.name);
      },
    };
  },
});