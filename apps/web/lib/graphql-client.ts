import { GraphQLClient } from 'graphql-request';
import { useAuthStore } from '../stores/auth.store';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/graphql';

export const gqlClient = new GraphQLClient(API_URL);

/**
 * Returns a GraphQL client with the current JWT access token injected.
 * Use this in TanStack Query queryFn / mutationFn.
 */
export function getAuthenticatedClient(): GraphQLClient {
  const token = useAuthStore.getState().accessToken;
  return new GraphQLClient(API_URL, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

/**
 * GraphQL tag template literal — no-op but enables IDE syntax highlighting
 */
export function gql(strings: TemplateStringsArray, ...values: unknown[]): string {
  return strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), '');
}
