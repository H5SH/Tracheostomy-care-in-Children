
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

const English={
    'Introduction': require('../../assets/Videos/English/IntroductionEnglish.mp4'),//5
    // 'Tracheostomy Suction Requirement': require('../../assets/Videos/TracheostomySuctionRequirmnt_video.mp4'),
    // 'Tracheal suctioning': require('../../assets/Videos/TracheostomySuctionRequirmnt_video.mp4'),//10
    // 'Clear inner cannula': require('../../assets/Videos/English/CleanYourInnerCannulaEnglish.mp4'),//3
    'Hand hygiene': require('../../assets/Videos/English/HandHygieneEnglish.mp4'),//4
    // 'Clean suction catheter': require('../../assets/Videos/English/CleanSuctionCatheterEnglish.mp4'),//9
    // 'Inspect skin around tracheostomy tube': require('../../assets/Videos/English/InspectionAroundSkinEnglish.mp4'),//8
    'Clean skin around stoma': require('../../assets/Videos/English/CleanSkinAroundStomaEnglish.mp4'),//2
    'Providing oral hygiene': require('../../assets/Videos/English/OralHygieneEnglish.mp4'),//1
    'Ensure patency of the airway (tracheostomy tube)': require('../../assets/Videos/English/SuctionAirwayPotencyEnglish.mp4'),
    // 'Trachestomy Care at Home': require('../../assets/Videos/TracheostomyCareInHome.mp4'),
    // 'Routine Trach Change': require('../../assets/Videos/RoutineTrachChange.webm'),
    'Putting guaze on the trachostomy site': require('../../assets/Videos/English/GauzeOnTracheostomySiteEnglish.mp4'),
}

// const Urdu={
    // 'Introduction': require('../../assets/Videos/Introduction_video.mp4'),//5
    // 'Tracheostomy Suction Requirement': require('../../assets/Videos/TracheostomySuctionRequirmnt_video.mp4'),
    // // 'Tracheal suctioning': require('../../assets/Videos/TracheostomySuctionRequirmnt_video.mp4'),//10
    // 'Clear inner cannula': require('../../assets/Videos/Urdu/CleanYourInnerCannulaUrdu.mp4'),//3
    // 'Hand hygiene': require('../../assets/Videos/Urdu/HandHygieneUrdu.mp4'),//4
    // 'Clean suction catheter': require('../../assets/Videos/Urdu/CleanSuctionCatheterUrdu.mp4'),//9
    // 'Inspect skin around tracheostomy tube': require('../../assets/Videos/Urdu/InspectionAroundSkinUrdu.mp4'),//8
    // 'Clean skin around stoma': require('../../assets/Videos/Urdu/CleanSkinAroundStomaUrdu.mp4'),//2
    // 'Providing oral hygiene': require('../../assets/Videos/Urdu/OralHygieneUrdu.mp4'),//1
    // 'Ensure patency of the airway (tracheostomy tube)': require('../../assets/Videos/Urdu/SuctionAirwayPotencyUrdu.mp4'),
    // 'Trachestomy Care at Home': require('../../assets/Videos/TracheostomyCareInHome.mp4'),
    // 'Routine Trach Change': require('../../assets/Videos/RoutineTrachChange.webm'),
    // 'Putting guaze on the trachostomy site': require('../../assets/Videos/Urdu/GauzeOnTracheostomySiteUrdu.mp4'),
// }

// const Punjabi={
//     'Introduction': require('../../assets/Videos/Introduction_video.mp4'),//5
//     'Tracheostomy Suction Requirement': require('../../assets/Videos/TracheostomySuctionRequirmnt_video.mp4'),
//     // 'Tracheal suctioning': require('../../assets/Videos/TracheostomySuctionRequirmnt_video.mp4'),//10
//     'Clear inner cannula': require('../../assets/Videos/CleanYourInnerCannula.mp4'),//3
//     'Hand hygiene': require('../../assets/Videos/Punjabi/HandHygienePunjabi.mp4'),//4
//     'Clean suction catheter': require('../../assets/Videos/TracheostomySuction.mp4'),//9
//     'Inspect skin around tracheostomy tube': require('../../assets/Videos/TracheostomySiteCare.mp4'),//8
//     'Clean skin around stoma': require('../../assets/Videos/CleanSkinAroundTracheostomyTube.mp4'),//2
//     'Providing oral hygiene': require('../../assets/Videos/CleanOralPart_video.mp4'),//1
//     'Ensure patency of the airway (tracheostomy tube)': require('../../assets/Videos/CleanYourInnerCannula.mp4'),
//     'Trachestomy Care at Home': require('../../assets/Videos/TracheostomyCareInHome.mp4'),
//     'Routine Trach Change': require('../../assets/Videos/RoutineTrachChange.webm'),
//     'Putting guaze on the trachostomy site': require('../../assets/Videos/RoutineTrachChange.webm'),
// }
export { names, details, English, 
    // Urdu, 
    images };
