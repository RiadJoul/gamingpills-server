import { Game } from "../entities/Game";
import { MyContext } from "../types";
import { Category } from "../enums/Game";
import {
  Arg,
  Ctx,
  Mutation,
  Query,
  Resolver,
  UseMiddleware,
} from "type-graphql";
import { Authentication } from "../middelware/Authentication";
import { Admin } from "../middelware/Admin";
import { GeneralResponse } from "./Responses/General/GeneralResponse";
import { GameMode } from "../entities/GameMode";
import { wrap } from "@mikro-orm/core"


@Resolver()
export class GameResolver {
  @Mutation(() => GeneralResponse)
  @UseMiddleware(Authentication)
  @UseMiddleware(Admin)
  async createGame(@Ctx() { em }: MyContext,
    @Arg("name") name: string,
  ): Promise<GeneralResponse> {
    const game = em.create(Game, {
      active: true,
      category: Category.SPORTS,
      name: name,
    } as Game);
    await em.persistAndFlush(game);
    return { success: true };
  }
  //TODO: upload game cover


  @Query(() => [Game], { nullable: true })
  async games(@Ctx() { em }: MyContext): Promise<any> {
    return await em.find(Game, {})
  }

  @Query(() => [GameMode], { nullable: true })
  async gamesModes(@Ctx() { em }: MyContext): Promise<any> {
    return await em.find(GameMode, {})
  }

  @Mutation(() => GeneralResponse)
  @UseMiddleware(Authentication)
  @UseMiddleware(Admin)
  async updateGame(@Ctx() { em }: MyContext,
    @Arg("gameId") gameId: number,
    @Arg("active") active: boolean,
    @Arg("name") name: string,
  ): Promise<GeneralResponse> {
    const game = await em.findOne(Game, { id: gameId });
    if (!game) {
      return {
        errors: [
          { field: "Game", message: "Game not found" }
        ]
      }
    }
    wrap(game).assign({
      active: active,
      name: name,
    })
    return { success: true };
  }

  @Mutation(() => GeneralResponse)
  @UseMiddleware(Authentication)
  @UseMiddleware(Admin)
  async createGameMode(@Ctx() { em }: MyContext,
    @Arg("gameId") gameId: number,
    @Arg("name") name: string
  ): Promise<GeneralResponse> {
    const gameMode = em.create(GameMode, {
      Game: em.getReference(Game, gameId),
      name: name
    } as any);
    await em.persistAndFlush(gameMode);
    return { success: true };
  }


  @Mutation(() => GeneralResponse)
  @UseMiddleware(Authentication)
  @UseMiddleware(Admin)
  async deleteGame(@Ctx() { em }: MyContext,
    @Arg("gameId") gameId: number,
  ): Promise<GeneralResponse> {

    const game = await em.findOne(Game, { id: gameId })
    if (!game) {
      return {
        errors: [{ field: "Not Found", message: "Game not found" }]
      }
    }

    //delete all the game modes related to the game
    const gameModes = await em.find(GameMode, { Game: game.id });

    gameModes.forEach(async (gameMode: GameMode) => {
      await em.removeAndFlush(gameMode);
    })

    await em.removeAndFlush(game)

    return { success: true };
  }

  @Mutation(() => GeneralResponse)
  @UseMiddleware(Authentication)
  @UseMiddleware(Admin)
  async deleteGameMode(@Ctx() { em }: MyContext,
    @Arg("gameModeId") gameModeId: number,
  ): Promise<GeneralResponse> {

    const gameMode = await em.findOne(GameMode, { id: gameModeId })
    if (!gameMode) {
      return {
        errors: [{ field: "Not Found", message: "Game mode not found" }]
      }
    }

    await em.removeAndFlush(gameMode)

    return { success: true };
  }


}
