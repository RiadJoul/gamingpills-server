// this service ensures that the user does not spam the chat
import { MAX_MESSAGES_PER_10_SECONDS } from '../constants';
import { RateLimiterMemory } from 'rate-limiter-flexible';

export const Limiter = new RateLimiterMemory({
    points: MAX_MESSAGES_PER_10_SECONDS,
    duration: 10,
  });