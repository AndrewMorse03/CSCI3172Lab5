import express from "express";
import serverless from "serverless-http";
import fetch from "node-fetch";
import dotenv from "dotenv";
import cors from "cors";
import { error } from "console";

dotenv.config();

const api = express();
const router = express.Router();

api.use(cors({
    origin: '*',
}));

const API_KEY = process.env.FOOD_API_KEY;
// const API_KEY = '38c10739a61e47138ab52d6835ed5f33';

router.get("/random", async (req, res)  => {

    let request = `https://api.spoonacular.com/recipes/random?apiKey=${API_KEY}&number=2&include-tags=dinner`;

    const param = req.query.param;


    if(param !== undefined) {
        let searchParams = param.split(',');
        let include = [];
        let exclude = [];

        for (let i = 0; i < searchParams.length; i++){
            if(searchParams[i] == 'peanut'){
                exclude.push(searchParams[i]);
            } else {
                include.push(searchParams[i]);
            }
        }
        if(include.length > 0) {
            request = request + `,${include.join(',')}`;
        }
        if(exclude.length > 0){
            request = request + `&exclude-tags=${exclude.join(',')}`;
        }
    }
    

    try {

        const response = await fetch(request);
        const data = await response.json();

        if(response.status != 200){
            return res.status(400).json({ error: "No Recipes could be found"})
        }

        res.json({
            recipe1: data.recipes[0],
            recipe2: data.recipes[1],
        });

    } catch (error) {
        res.status(500).json({ error: "Server Error - Please try again later" });
    }

});


  
api.listen(5000, () => {
    console.log('Backend is running on http://localhost:5000');
});

api.use("/api/", router);
export const handler = serverless(api);