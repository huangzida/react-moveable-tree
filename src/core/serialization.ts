import { boxNodeSchema, type BoxNode } from '../types/model';

export function parseTreeJSON(raw: string): BoxNode[] {
  const parsed = JSON.parse(raw);
  return boxNodeSchema.array().parse(parsed);
}

export function stringifyTreeJSON(tree: BoxNode[]): string {
  return JSON.stringify(tree);
}