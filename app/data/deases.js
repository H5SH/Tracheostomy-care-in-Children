
const names = [
    'Introduction',//y
    // 'Tracheostomy Suction Requirement',
    // 'Tracheal suctioning',
    // 'Clear inner cannula',//y
    'Hand hygiene',//y
    // 'Clean suction catheter',
    // 'Inspect skin around tracheostomy tube',
    'Clean skin around stoma',
    'Providing oral hygiene',
    'Ensure patency of the airway (tracheostomy tube)',
    // 'Trachestomy Care at Home',
    // 'Routine Trach Change',
    // 'Suction pressure airway potency',
    'Putting guaze on the trachostomy site',
];

const details = {
    'Introduction': 'This is Introduction about Tracheostomy care in Children',
    // 'Tracheostomy Suction Requirement': 'This is Introduction about Tracheostomy care in Children',
    // 'Tracheal suctioning': 'Tracheal suctioning is a procedure to remove mucus and secretions from the trachea and lower airways. It is often performed on patients with a tracheostomy tube or endotracheal tube to maintain airway patency.',
    // 'Clear inner cannula': 'Clearing the inner cannula of a tracheostomy tube involves removing and cleaning the inner portion of the tube to prevent blockage and maintain proper airflow.',
    'Hand hygiene': 'Hand hygiene refers to the practice of keeping hands clean to prevent the spread of germs and infections. It includes washing hands with soap and water or using hand sanitizer.',
    // 'Clean suction catheter': 'Cleaning the suction catheter involves removing mucus and secretions from the catheter used during suctioning procedures. This helps prevent contamination and infection.',
    // 'Inspect skin around tracheostomy tube': 'Inspecting the skin around the tracheostomy tube is important to identify any signs of irritation, infection, or pressure injury. Proper skin care helps prevent complications.',
    'Clean skin around stoma': 'Cleaning the skin around the stoma (opening) of a tracheostomy tube is important to prevent infection and irritation. It involves gentle cleansing and patting the skin dry.',
    'Providing oral hygiene': 'Providing oral hygiene involves cleaning the mouth and teeth to prevent dental problems, bad breath, and infections. It is especially important for patients who are unable to perform oral care themselves.',
    'Ensure patency of the airway (tracheostomy tube)': 'Ensuring the patency of the airway involves keeping the tracheostomy tube clear and free from obstruction to maintain proper breathing and oxygenation.',
    // 'Trachestomy Care at Home': 'Cleaning the skin around the stoma (opening) of a tracheostomy tube is important to prevent infection and irritation. It involves gentle cleansing and patting the skin dry.',
    // 'Routine Trach Change': 'Ensuring the patency of the airway involves keeping the tracheostomy tube clear and free from obstruction to maintain proper breathing and oxygenation.',
    // 'Suction pressure airway potency': 'Ensuring the patency of the airway involves keeping the tracheostomy tube clear and free from obstruction to maintain proper breathing and oxygenation.',
    'Putting guaze on the trachostomy site': 'Ensuring the patency of the airway involves keeping the tracheostomy tube clear and free from obstruction to maintain proper breathing and oxygenation.',
};


const images = {
    'Introduction': require('../../assets/Introduction.jpg'),
    // 'Tracheostomy Suction Requirement': require('../../assets/TracheostomySuctionRequirement.jpg'),
    // 'Tracheal suctioning': require('../../assets/trachealSuctioning.jpg'),
    // 'Clear inner cannula': require('../../assets/clearInnerCannula.jpg'),
    'Hand hygiene': require('../../assets/handHygiene.jpg'),
    // 'Clean suction catheter': require('../../assets/cleanSuctionCatheter.jpg'),
    // 'Inspect skin around tracheostomy tube': require('../../assets/inspectionSkinAroundTracheostomyTube.jpg'),
    'Clean skin around stoma': require('../../assets/cleanSkinAroundStoma.jpg'),
    'Providing oral hygiene': require('../../assets/providingOralHygiene.jpg'),
    'Ensure patency of the airway (tracheostomy tube)': require('../../assets/SuctionPressureAirwayPotency.jpg'),
    // 'Trachestomy Care at Home': require('../../assets/TracheostomyCareAtHome.jpg'),
    // 'Routine Trach Change': require('../../assets/RoutineTrachChange.jpeg'),
    'Putting guaze on the trachostomy site': require('../../assets/GauzeOnTracheostomySite.jpeg'),
    // 'Suction pressure airway potency': require('../../assets/RoutineTrachChange.jpeg'),

}

// Videos are no longer bundled with `require()`. They ship in the `urdu_videos` Google Play
// Asset Delivery install-time pack and are addressed by their path inside that pack, so these
// values are plain strings resolved at runtime by `app/media/assetPackVideos.js`.
// Source of truth for the files: `asset-packs/urdu_videos/videos/urdu/`.
const Urdu = {
    // 'Introduction': no Urdu recording exists yet.
    // 'Tracheostomy Suction Requirement': not recorded in Urdu.
    // 'Tracheal suctioning': not recorded in Urdu.
    'Clear inner cannula': 'videos/urdu/CleanYourInnerCannulaUrdu.mp4',//3
    'Hand hygiene': 'videos/urdu/HandHygieneUrdu.mp4',//4
    'Clean suction catheter': 'videos/urdu/CleanSuctionCatheterUrdu.mp4',//9
    'Inspect skin around tracheostomy tube': 'videos/urdu/InspectionAroundSkinUrdu.mp4',//8
    'Clean skin around stoma': 'videos/urdu/CleanSkinAroundStomaUrdu.mp4',//2
    'Providing oral hygiene': 'videos/urdu/OralHygieneUrdu.mp4',//1
    'Ensure patency of the airway (tracheostomy tube)': 'videos/urdu/SuctionAirwayPotencyUrdu.mp4',
    'Putting guaze on the trachostomy site': 'videos/urdu/GauzeOnTracheostomySiteUrdu.mp4',
}

// The English collection is incomplete, so the English option is hidden from the UI for now.
// The files are untouched under `assets/Videos/English/`; restoring the option means moving them
// into an `english_videos` asset pack and adding an entry to `languages` below.
// const English = {
//     'Introduction': 'videos/english/IntroductionEnglish.mp4',//5
//     'Hand hygiene': 'videos/english/HandHygieneEnglish.mp4',//4
//     'Clean skin around stoma': 'videos/english/CleanSkinAroundStomaEnglish.mp4',//2
//     'Providing oral hygiene': 'videos/english/OralHygieneEnglish.mp4',//1
//     'Ensure patency of the airway (tracheostomy tube)': 'videos/english/SuctionAirwayPotencyEnglish.mp4',
//     'Putting guaze on the trachostomy site': 'videos/english/GauzeOnTracheostomySiteEnglish.mp4',
// }

// Punjabi currently has a single recording, so the option is hidden from the UI for now.
// const Punjabi = {
//     'Hand hygiene': 'videos/punjabi/HandHygienePunjabi.mp4',//4
// }

/**
 * Languages offered on the video screen, in display order. The first entry is the default.
 * Add a language back by shipping its videos in an asset pack and listing it here.
 */
const languages = [
    { key: 'urdu', label: 'Urdu', videos: Urdu },
];

const defaultLanguage = languages[0];

export {
    names, details, images,
    Urdu,
    languages, defaultLanguage,
};
