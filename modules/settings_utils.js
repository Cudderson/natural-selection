// this module should handle all settings-validation logic and return valid settings to simulator.js
import { prepareToRunSimulation } from "./drawings.js";

function displaySettingsForm() {

    // ensure only settings button showing
    // document.getElementsByClassName("settings-btn")[0].style.display = 'block';
    document.getElementsByClassName("run-btn")[0].style.display = 'none';
    document.getElementsByClassName("stop-btn")[0].style.display = 'none';
    document.getElementsByClassName("save-boundaries-btn")[0].style.display = 'none';

    // turn off canvas, turn on settings
    document.getElementsByClassName("canvas-container")[0].style.display = 'none';
    document.getElementsByClassName("settings-container")[0].style.display = 'block';

    if (simGlobals.sim_type === 'classic') {
        // display classic settings (no death/resilience)
        document.getElementsByClassName("resilience-setting-label")[0].style.display = 'none';
        document.getElementsByClassName("resilience-input")[0].style.display = 'none';
        document.getElementsByClassName("setting-caption-resilience")[0].style.display = 'none';
    }

    // movement setting helper (move/abstract)
    let movement_speed_setting = document.getElementById("move-speed");
    let error_message = document.getElementsByClassName("error-message")[0];

    movement_speed_setting.addEventListener('focusin', function() {
        error_message.style.color = "var(--closest_organism_gold)";
        error_message.innerHTML = "Movement Speed Range: 1 - 7";
        movement_speed_setting.addEventListener('focusout', function() {
            error_message.style.color = 'var(--mother-pink)';
            error_message.innerHTML = "";
        })
    })

    movement_speed_setting.addEventListener('keydown', function(event) {
        // function blocks keystrokes not within the acceptable range for movement speed
        let keystroke = preValidateMovementSetting(event);
        if (keystroke === 1) {
            event.preventDefault();
        }
    });

    // POP_GROWTH toggle button listener (move/abstract/make 'toggleGrowthBtn' function) 
    let growth_toggle_btn = document.getElementsByClassName("growth-toggle-btn")[0];

    growth_toggle_btn.addEventListener('click', function toggle() {
        if (growth_toggle_btn.innerHTML === 'Constant') {
            growth_toggle_btn.innerHTML = 'Fluctuate';
        }
        else {
            growth_toggle_btn.innerHTML = 'Constant';
        }
    });
}

function validateTotalOrganismsSetting() {
    let total_organisms_setting = document.getElementById("total-organisms");
    let valid_setting;

    if (typeof parseInt(total_organisms_setting.value) === 'number' && parseInt(total_organisms_setting.value) > 0) {
        if (parseInt(total_organisms_setting.value > 9999)) {
            // simGlobals.TOTAL_ORGANISMS = 9999;
            valid_setting = 9999;
        }
        else {
            // simGlobals.TOTAL_ORGANISMS = Math.abs(parseInt(total_organisms_setting.value));
            valid_setting = Math.abs(parseInt(total_organisms_setting.value));
        }

        total_organisms_setting.style.borderBottom = '2px solid var(--custom-green)';
        
        return {
            'status': 'valid',
            'value': valid_setting,
        };
    }

    else {
        total_organisms_setting.style.borderBottom = '2px solid var(--mother-pink)';

        return {
            'status': 'invalid',
            'value': '* Invalid number of organisms. Please input a positive number.',
        }
    }
}

// must be called after settings submitted
function calculateGeneCount() {
    // we need:
    // scale (boundary only) which is global via window.custom_boundary
    let gene_count;
    if (simGlobals.sim_type === 'classic') {
        gene_count = 1250 / simGlobals.MAX_GENE;
    }
    else if (simGlobals.sim_type === 'boundary') {
        gene_count = (simGlobals.custom_boundary.scale_statistics.scale * 3) / simGlobals.MAX_GENE;
    }

    return gene_count;
}

function validateMutationRateSetting() {
    let mutation_rate_setting = document.getElementById("mutation-rate");
    let valid_setting;

    // consider allowing float here
    if (typeof parseInt(mutation_rate_setting.value) === 'number' && parseInt(mutation_rate_setting.value) > 0) {
        if (parseInt(mutation_rate_setting.value) > 100) {
            // simGlobals.MUTATION_RATE = 1;
            valid_setting = 1;
        }

        else {
            // simGlobals.MUTATION_RATE = parseInt(mutation_rate_setting.value) / 100;
            valid_setting = parseInt(mutation_rate_setting.value) / 100;
        }

        mutation_rate_setting.style.borderBottom = '2px solid var(--custom-green)';

        return {
            'status': 'valid',
            'value': valid_setting,
        }
    }

    else {
        mutation_rate_setting.style.borderBottom = '2px solid var(--mother-pink)';

        return {
            'status': 'invalid',
            'value': "Invalid mutation rate. Please input a positive percentage value. (3 = 3%)"
        }
    }
}

function preValidateMovementSetting(event) {

    // prevent keystrokes that aren't === 1-7 || Backspace, <, > 
    let movement_key = event.key;
    if (movement_key > "0" && movement_key <= "7") {
        return 0;
    }
    else if (movement_key === "Backspace" || movement_key === "ArrowLeft" || movement_key === "ArrowRight") {
        return 0;
    }
    else {
        return 1;
    }
}

function validateMovementSetting() {
    let movement_speed_setting = document.getElementById("move-speed");
    let valid_setting;

    // create max and min genes from movement speed
    // pre-validated in preValidateMovementSetting();
    if (parseInt(movement_speed_setting.value) > 0 && parseInt(movement_speed_setting.value) <= 7) {

        // do this logic after validated
        // simGlobals.MIN_GENE = parseInt(movement_speed_setting.value) * -1;
        // simGlobals.MAX_GENE = parseInt(movement_speed_setting.value);
        valid_setting = parseInt(movement_speed_setting.value);

        movement_speed_setting.style.borderBottom = "2px solid var(--custom-green)";

        return {
            'status': 'valid',
            'value': valid_setting
        }
    } 

    else {
        movement_speed_setting.style.borderBottom = '2px solid var(--mother-pink)';

        return {
            'status': 'invalid',
            'value': "Invalid movement speed. Please input a positive number between 1 - 7."
        }
    }   
}

function validateResilienceSetting() {
    // we want to only allow numbers from 0 - 100 inclusive

    let resilience_setting = document.getElementById("resilience");
    let valid_setting;

    if (parseInt(resilience_setting.value) >= 0 && parseInt(resilience_setting.value) <= 100 && typeof parseInt(resilience_setting.value) === 'number') {

        // simGlobals.RESILIENCE = parseInt(resilience_setting.value) / 100;
        valid_setting = parseInt(resilience_setting.value) / 100;

        resilience_setting.style.borderBottom = "2px solid var(--custom-green)";

        return {
            'status': 'valid',
            'value': valid_setting
        }
    }

    else {
        resilience_setting.style.borderBottom = '2px solid var(--mother-pink)';

        return {
            'status': 'invalid',
            'value': "Invalid resilience value. Please input a positive number between 0 - 100"
        }
    } 
}

function validateSettingsForm() {

    let error_message = document.getElementsByClassName("error-message")[0];

    // clear error message on call
    error_message.style.color = "var(--mother-pink)";
    error_message.innerHTML = "";

    let settings_manager = {};

    settings_manager.organisms_setting = validateTotalOrganismsSetting();
    settings_manager.movement_setting = validateMovementSetting();
    // settings_manager.gene_setting = validateGeneCountSetting();
    settings_manager.mutation_setting = validateMutationRateSetting();
    settings_manager.resilience_setting = validateResilienceSetting();

    let settings = Object.values(settings_manager);

    let all_settings_valid = true;

    settings.forEach((setting => {
        if (setting.status != 'valid') {
            error_message.innerHTML = setting.value;
            all_settings_valid = false;
        }
    }));

    // ===== dialogue & growth applications should be moved to applyValidSettings() =====

    // dialogue
    let dialogue_setting = document.getElementById("dialogue-checkbox");
    if (dialogue_setting.checked) {
        simGlobals.dialogue = true;
    }
    else {
        simGlobals.dialogue = false;
    }

    // population growth
    // check inner html of button
    if (document.getElementsByClassName("growth-toggle-btn")[0].innerHTML === 'Constant') {
        simGlobals.POP_GROWTH = 'constant';
    }
    else {
        simGlobals.POP_GROWTH = 'fluctuate';
    }

    if (all_settings_valid) {
        // turns off settings form, turns on canvas and run-btn
        applyValidSettings(settings_manager);
        prepareToRunSimulation(); // drawing
    }

    // don't submit the form
    return false;
}

// needs better name
function applyValidSettings(settings_manager) {

    // apply setting to global object
    simGlobals.TOTAL_ORGANISMS = settings_manager.organisms_setting.value;
    simGlobals.MIN_GENE = settings_manager.movement_setting.value * -1;
    simGlobals.MAX_GENE = settings_manager.movement_setting.value;
    // simGlobals.GENE_COUNT = settings_manager.gene_setting.value;
    simGlobals.MUTATION_RATE = settings_manager.mutation_setting.value;
    simGlobals.GENE_COUNT = calculateGeneCount();

    if (simGlobals.sim_type === 'boundary') {
        simGlobals.RESILIENCE = settings_manager.resilience_setting.value;
    }

    console.log(simGlobals);

    // make html changes before function returns
    document.getElementsByClassName("canvas-container")[0].style.display = 'block';
    document.getElementsByClassName("settings-container")[0].style.display = 'none';

    // listener already applied
    let start_btn = document.getElementsByClassName("run-btn")[0];
    start_btn.style.display = 'block';

    return false;
}

// this function triggers settings form display and creates listener for submitted form
function configureSettings() {

    document.getElementsByClassName("setting-submit")[0].style.display = 'block';

    // turn on listener for apply button
    // document.getElementById("apply-form").addEventListener('submit', function submitForm(event) {
    //     // don't submit form
    //     event.preventDefault();
    
    //     validateSettingsForm();
    // });

    // not a submitted form anymore, now listen for click on Apply btn
    document.getElementsByClassName("setting-submit")[0].addEventListener("click", function submitForm(event) {
        validateSettingsForm();
    });

    displaySettingsForm();
}

export {
    displaySettingsForm, validateTotalOrganismsSetting,
    validateMutationRateSetting, preValidateMovementSetting,
    validateMovementSetting, validateResilienceSetting,
    validateSettingsForm, configureSettings,
    calculateGeneCount,
}