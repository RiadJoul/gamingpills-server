import path from "path";
import * as fs from 'fs';

export const FileHelper = () => {
    
    const publicFolder = path.join(__dirname, "../public");
    const imagesFolder = path.join(__dirname, "../public/images");
    const gamesFolder = path.join(__dirname, "../public/images/games");
    const avatarsFolder = path.join(__dirname, "../public/images/avatars");
    if (!fs.existsSync(publicFolder)) {
        fs.mkdirSync(publicFolder);
        fs.mkdirSync(imagesFolder);
        fs.mkdirSync(gamesFolder);
        fs.mkdirSync(avatarsFolder);
    }

}

