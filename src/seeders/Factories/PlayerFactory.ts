import { Factory, Faker } from '@mikro-orm/seeder';
import { User } from '../../entities/User';
import { v4 as uuidv4 } from "uuid";
import { Role } from '../../enums/Roles';


export class PlayerFactory extends Factory<User> {
    model = User;


    definition(faker: Faker): Partial<User> {
        var uuid = uuidv4();

        return {
            id: uuid,
            role: Role.PLAYER,
            // avatar: faker.internet.avatar(),
            username: "user-" + faker.random.numeric(4),
            firstName: faker.name.firstName(),
            lastName: faker.name.lastName(),
            birthDate: faker.date.between("2000-01-01T00:00:00.000Z", "2002-01-01T00:00:00.000Z"),
            email: faker.internet.email(),
            emailVerified: true,
            password: "$argon2id$v=19$m=4096,t=3,p=1$xTg6heUbJW92xMX+37kTHg$Bfi6LHAI3hIxP3QlyTBPVLE9YyBj1882prJYXGWlErk",
            psnId: "PS-" + faker.internet.userName(),
            xboxId: "XBOX-" + faker.internet.userName(),
            lastSeen: new Date()
        };
    }
}