/**
 * Format a long-form comment to HTML for rendering on a real page. This will return a HTML string
 * that is wrapped in elements such as <p> and <ul>.
 *
 * @template T
 * @param {typedocModels.Comment|string|undefined} comment
 * @param {symbolTypes.CommentHelper<T>} helper
 * @return {string}
 */
export function formatComment<T>(comment: typedocModels.Comment | string | undefined, helper: symbolTypes.CommentHelper<T>): string;
/**
 * Formats a short-form comment, such as for a at-deprecated notice. This returns HTML but does not
 * add or ensure normal paragraph elements such as <p> or <ul>.
 *
 * @template T
 * @param {string} text
 * @param {symbolTypes.CommentHelper<T>} helper
 * @return {string}
 */
export function formatCommentLine<T>(text: string, helper: symbolTypes.CommentHelper<T>): string;
import * as typedocModels from "typedoc/dist/lib/models";
import * as symbolTypes from "../../types/symbol.js";
