import { Catch, ArgumentsHost, Logger } from '@nestjs/common';
import { GqlExceptionFilter } from '@nestjs/graphql';
import { GraphQLError } from 'graphql';

@Catch()
export class GraphQLExceptionFilter implements GqlExceptionFilter {
  private readonly logger = new Logger(GraphQLExceptionFilter.name);

  catch(exception: unknown, _host: ArgumentsHost): GraphQLError {
    this.logger.error('GraphQL error', exception instanceof Error ? exception.stack : exception);

    if (exception instanceof GraphQLError) return exception;

    const message = exception instanceof Error ? exception.message : 'Internal server error';

    const code =
      (exception as any)?.status === 401
        ? 'UNAUTHENTICATED'
        : (exception as any)?.status === 403
          ? 'FORBIDDEN'
          : (exception as any)?.status === 400
            ? 'BAD_USER_INPUT'
            : 'INTERNAL_SERVER_ERROR';

    return new GraphQLError(message, { extensions: { code } });
  }
}
