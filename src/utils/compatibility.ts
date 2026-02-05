import { Profile, Preferences } from '../types/user';

export interface CompatibilityResult {
  score: number;
  matches: string[];
  mismatches: string[];
}

export function calculateCompatibility(
  profile: Profile,
  userProfile: Profile,
  userPreferences: Preferences | undefined
): CompatibilityResult {
  if (!userPreferences) {
    return { score: 0, matches: [], mismatches: [] };
  }

  let totalPoints = 0;
  let earnedPoints = 0;
  const matches: string[] = [];
  const mismatches: string[] = [];

  // 1. Marriage Timeline (Critical - 25 points)
  if (userProfile.marriage_timeline && profile.marriage_timeline) {
    totalPoints += 25;
    if (userProfile.marriage_timeline === profile.marriage_timeline) {
      earnedPoints += 25;
      matches.push('Marriage timeline aligned');
    } else if (
      (userProfile.marriage_timeline === 'within_year' && profile.marriage_timeline === 'one_to_two_years') ||
      (userProfile.marriage_timeline === 'one_to_two_years' && profile.marriage_timeline === 'within_year')
    ) {
      earnedPoints += 18;
      matches.push('Marriage timeline compatible');
    } else if (userProfile.marriage_timeline !== 'not_sure' && profile.marriage_timeline !== 'not_sure') {
      earnedPoints += 10;
      matches.push('Marriage timeline somewhat aligned');
    } else {
      mismatches.push('Marriage timeline');
    }
  }

  // 2. Religious Practice (High weight - 20 points)
  if (userProfile.religious_practice && profile.religious_practice) {
    totalPoints += 20;
    const practiceLevels = ['very_practicing', 'practicing', 'somewhat_practicing', 'cultural', 'not_practicing'];
    const userLevel = practiceLevels.indexOf(userProfile.religious_practice);
    const profileLevel = practiceLevels.indexOf(profile.religious_practice);
    
    if (userLevel !== -1 && profileLevel !== -1) {
      const difference = Math.abs(userLevel - profileLevel);
      if (difference === 0) {
        earnedPoints += 20;
        matches.push('Religious practice aligned');
      } else if (difference === 1) {
        earnedPoints += 15;
        matches.push('Religious practice compatible');
      } else if (difference === 2) {
        earnedPoints += 8;
        matches.push('Religious practice somewhat aligned');
      } else {
        mismatches.push('Religious practice');
      }
    }
  }

  // 3. Core Values (High weight - 15 points)
  if (userPreferences.values && userPreferences.values.length > 0 && profile.preferences?.values) {
    totalPoints += 15;
    const commonValues = userPreferences.values.filter(v => profile.preferences?.values?.includes(v));
    if (commonValues.length >= 3) {
      earnedPoints += 15;
      matches.push(`${commonValues.length} shared values`);
    } else if (commonValues.length >= 2) {
      earnedPoints += 10;
      matches.push(`${commonValues.length} shared values`);
    } else if (commonValues.length >= 1) {
      earnedPoints += 5;
      matches.push(`${commonValues.length} shared value`);
    } else {
      mismatches.push('Core values');
    }
  }

  // 4. Children Compatibility (Medium-High weight - 12 points)
  if (userProfile.wants_children !== undefined && profile.wants_children !== undefined) {
    totalPoints += 12;
    if (userProfile.wants_children === profile.wants_children) {
      earnedPoints += 12;
      matches.push('Children goals aligned');
    } else {
      mismatches.push('Children goals');
    }
  }

  // 5. Education Level (Medium weight - 10 points)
  if (userProfile.education_level && profile.education_level) {
    totalPoints += 10;
    const educationLevels = ['high_school', 'some_college', 'bachelors', 'masters', 'doctorate', 'other'];
    const userEdu = educationLevels.indexOf(userProfile.education_level);
    const profileEdu = educationLevels.indexOf(profile.education_level);
    
    if (userEdu !== -1 && profileEdu !== -1) {
      const difference = Math.abs(userEdu - profileEdu);
      if (difference <= 1) {
        earnedPoints += 10;
        matches.push('Education level compatible');
      } else if (difference === 2) {
        earnedPoints += 5;
      }
    }
  }

  // 6. Family Involvement (Medium weight - 8 points)
  if (userProfile.family_involvement && profile.family_involvement) {
    totalPoints += 8;
    if (userProfile.family_involvement === profile.family_involvement) {
      earnedPoints += 8;
      matches.push('Family involvement aligned');
    } else if (
      (userProfile.family_involvement === 'very_involved' && profile.family_involvement === 'somewhat_involved') ||
      (userProfile.family_involvement === 'somewhat_involved' && profile.family_involvement === 'very_involved')
    ) {
      earnedPoints += 5;
      matches.push('Family involvement compatible');
    }
  }

  // 7. Relationship Intent (Critical - 20 points)
  if (userPreferences.relationship_intent && profile.preferences?.relationship_intent) {
    totalPoints += 20;
    const userIntent = userPreferences.relationship_intent;
    const profileIntent = profile.preferences.relationship_intent;
    
    // Exact match is best
    if (userIntent === profileIntent) {
      earnedPoints += 20;
      matches.push('Relationship goals aligned');
    } else {
      // Compatible intents
      const marriageIntents = ['marriage', 'courtship', 'serious_relationship'];
      const longTermIntents = ['long_term', 'life_partner', 'serious_relationship'];
      
      if (marriageIntents.includes(userIntent) && marriageIntents.includes(profileIntent)) {
        earnedPoints += 15;
        matches.push('Relationship goals compatible');
      } else if (longTermIntents.includes(userIntent) && longTermIntents.includes(profileIntent)) {
        earnedPoints += 12;
        matches.push('Relationship goals somewhat aligned');
      } else {
        mismatches.push('Relationship goals');
      }
    }
  }

  // 8. Common Interests (Medium weight - 10 points)
  if (userProfile.interests && profile.interests && userProfile.interests.length > 0) {
    totalPoints += 10;
    const commonInterests = profile.interests.filter(i => userProfile.interests?.includes(i));
    if (commonInterests.length >= 3) {
      earnedPoints += 10;
      matches.push(`${commonInterests.length} shared interests`);
    } else if (commonInterests.length >= 2) {
      earnedPoints += 7;
      matches.push(`${commonInterests.length} shared interests`);
    } else if (commonInterests.length >= 1) {
      earnedPoints += 4;
      matches.push(`${commonInterests.length} shared interest`);
    }
  }

  const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;

  return {
    score,
    matches,
    mismatches
  };
}
