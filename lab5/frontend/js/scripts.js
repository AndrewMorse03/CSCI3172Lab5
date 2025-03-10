const form = document.getElementById('recForm');
let checked = [];


async function getRecipe() {
    const recipeHolder = document.getElementById('recipes');
    const recipeHolder2 = document.getElementById('recipe2');

    
    const errorHolder = document.getElementById('error');
    errorHolder.classList.add('d-none');
    
    try {
        let response;

        if(checked.length == 0) {
            response = await fetch(`api/random`);
        } else {
            response = await fetch(`api/random?param=${checked.join(',')}`);
        }
    
    
        const data = await response.json();

        if(data.error) {
            errorHolder.innerHTML = `${data.error}`;
            errorHolder.classList.remove('d-none');
            recipeHolder.style.display = "none";
            
        } else if (Object.keys(data).length == 1) {
    
            document.getElementById('recipe1').innerHTML = 
            `
                    <h5 class="pt-2">${data.recipe1.title}</h5>
                    <img src="${data.recipe1.image}" alt="${data.recipe1.title}" class="img-thumbnail img-fluid">
                    <h6 class="pt-3">Ingredients</h6>
                    ${displayIngredients(data.recipe1.extendedIngredients)}
                    <h6>Instructions</h6>
                    <p class="p-4">${data.recipe1.instructions}</p>
                    <p>For more information visit: <a href="${data.recipe1.spoonacularSourceUrl}">Here</a></p>
                `;
    
            document.getElementById('recipe2').innerHTML = ``;
            recipeHolder2.style.display = "none";
            recipeHolder.style.display = "flex";

        } else {
            document.getElementById('recipe1').innerHTML = 
                `
                    <h5 class="pt-2">${data.recipe1.title}</h5>
                    <img src="${data.recipe1.image}" alt="${data.recipe1.title}" class="img-thumbnail img-fluid">
                    <h6 class="pt-3">Ingredients</h6>
                    ${displayIngredients(data.recipe1.extendedIngredients)}
                    <h6>Instructions</h6>
                    <p class="p-4">${data.recipe1.instructions}</p>
                    <p>For more information visit: <a href="${data.recipe1.spoonacularSourceUrl}">Here</a></p>
                `;
            
            
            
            document.getElementById('recipe2').innerHTML = 
            `
                    <h5 class="pt-2">${data.recipe2.title}</h5>
                    <img src="${data.recipe2.image}" alt="${data.recipe2.title}" class="img-thumbnail img-fluid">
                    <h6 class="pt-3">Ingredients</h6>
                    ${displayIngredients(data.recipe2.extendedIngredients)}
                    <h6>Instructions</h6>
                    <p class="p-4">${data.recipe2.instructions}</p>
                    <p>For more information visit: <a href="${data.recipe2.spoonacularSourceUrl}">Here</a></p>
                `;
            
            recipeHolder2.style.display = "block";
            recipeHolder.style.display = "flex";
        }
    
    } catch (error) {
        alert("There was an error. Please try again later.");
        console.log(error.message);
        recipeHolder.style.display = "none";
    }
    

}

form.addEventListener('submit', (event)=> {
    event.preventDefault();
    checked = Array.from(document.querySelectorAll('input:checked')).map(input => input.value);
    getRecipe();
});

function displayIngredients(ingredients) {
    let result = "";

    for(item of ingredients){
        result += `<p>${item.original}</p>`
    }

    return result;
}