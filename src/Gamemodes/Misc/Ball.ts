/*
    DiepCustom - custom tank game server that shares diep.io's WebSocket protocol
    Copyright (C) 2022 ABCxFF (github.com/ABCxFF)

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published
    by the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with this program. If not, see <https://www.gnu.org/licenses/>
*/

import GameServer from "../../Game";
import ArenaEntity from "../../Native/Arena";
import ObjectEntity from "../../Entity/Object";

import Pentagon from "../../Entity/Shape/Pentagon";

import { Colors, ArenaFlags, PhysicsFlags } from "../../Const/Enums";
import { NameGroup } from "../../Native/FieldGroups";
import AbstractShape from "../../Entity/Shape/AbstractShape";
import { SandboxShapeManager } from "../Sandbox";

/**
 * Only spawns crashers
 */
class CustomShapeManager extends SandboxShapeManager {
    protected spawnShape(): AbstractShape {
        const {x, y} = this.arena.findSpawnLocation();

        const penta = new Pentagon(this.game, Math.random() < 0.25, Math.random() < 0.1);

        penta.position.values.x = Math.sign(x) * (Math.abs(x) - 200);
        penta.position.values.y = Math.sign(y) * (Math.abs(y) - 200);
        penta.relations.values.owner = penta.relations.values.team = this.arena;

        return penta;
    }
}

/**
 * Ball Gamemode Arena
 */
export default class BallArena extends ArenaEntity {
    /** Controller of all shapes in the arena. */
	protected shapes: CustomShapeManager = new CustomShapeManager(this);

    public constructor(game: GameServer) {
        super(game);

        this.arena.values.GUI |= ArenaFlags.canUseCheats;
        this.updateBounds(2500, 2500);

        const ball = new ObjectEntity(game);
        ball.name = new NameGroup(ball);
        ball.name.values.name = "im pacman"
        ball.physics.values.sides = 1;
        ball.style.values.color = Colors.ScoreboardBar;
        ball.physics.values.size = 100;
        ball.physics.values.absorbtionFactor = 10;
        ball.physics.values.objectFlags |= PhysicsFlags.isBase | PhysicsFlags.noOwnTeamCollision;
        ball.relations.values.team = ball;
    }
}