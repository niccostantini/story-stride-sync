
import { StorySettings } from "@/types";

interface StoryResult {
  storyText: string | string[];
  storyAudioUrl: string | string[] | null;
  wordCount: number;
}

export async function generateStory(settings: StorySettings, totalDurationSeconds: number): Promise<StoryResult> {
  // In a real app, this would connect to an actual API
  console.log('Generating story with settings:', settings);
  
  // Wait for a mock delay to simulate API call
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Calculate target word count based on reading rate and duration
  const readingRate = 2.5; // words per second
  const targetWordCount = Math.round(totalDurationSeconds * readingRate);
  
  let storyText: string | string[];
  let storyAudioUrl: string | string[] | null;
  
  // Generate story based on story mode
  switch (settings.storyMode) {
    case 'session': {
      // Generate one continuous story
      storyText = mockGenerateSessionStory(settings, targetWordCount);
      // Use a simplified silent MP3 data URL
      storyAudioUrl = 'data:audio/mp3;base64,SUQzAwAAAAAAElRJVDIAAAAGAAAAU2lsZW50AA==';
      break;
    }
      
    case 'set': {
      // Generate one story per set
      const stories: string[] = [];
      const audioUrls: string[] = [];
      
      settings.sets.forEach((set, index) => {
        // Calculate word count for this set based on proportion of exercise time
        const setDuration = set.intervals.reduce((sum, interval) => sum + interval.duration, 0);
        const setWordCount = Math.round((setDuration / totalDurationSeconds) * targetWordCount);
        
        stories.push(mockGenerateSetStory(settings, setWordCount, index, settings.sets.length));
        // Use simplified silent MP3 data URLs with unique identifiers
        audioUrls.push(`data:audio/mp3;base64,SUQzAwAAAAAAElRJVDIAAAAGAAAAU2lsZW50AA==`);
      });
      
      storyText = stories;
      storyAudioUrl = audioUrls;
      break;
    }
      
    case 'interval': {
      // Generate one story per interval
      const stories: string[] = [];
      const audioUrls: string[] = [];
      let intervalCounter = 0;
      
      settings.sets.forEach((set, setIndex) => {
        set.intervals.forEach((interval, intervalIndex) => {
          // Calculate word count for this interval based on proportion of time
          const intervalWordCount = Math.round((interval.duration / totalDurationSeconds) * targetWordCount);
          
          stories.push(mockGenerateIntervalStory(
            settings, 
            intervalWordCount, 
            setIndex, 
            settings.sets.length,
            intervalIndex,
            set.intervals.length,
            interval.label
          ));
          // Use simplified silent MP3 data URLs with unique identifiers
          audioUrls.push(`data:audio/mp3;base64,SUQzAwAAAAAAElRJVDIAAAAGAAAAU2lsZW50AA==`);
          intervalCounter++;
        });
      });
      
      storyText = stories;
      storyAudioUrl = audioUrls;
      break;
    }
      
    default:
      storyText = "Once upon a time...";
      storyAudioUrl = 'data:audio/mp3;base64,SUQzAwAAAAAAElRJVDIAAAAGAAAAU2lsZW50AA==';
  }
  
  const wordCount = typeof storyText === 'string' 
    ? countWords(storyText)
    : storyText.reduce((total, text) => total + countWords(text), 0);
  
  // Log the generated story for debugging
  console.log('Generated story text:', typeof storyText === 'string' ? storyText.substring(0, 100) + '...' : 'Multiple story segments');
  console.log('Generated audio URLs:', storyAudioUrl);
  
  return {
    storyText,
    storyAudioUrl,
    wordCount
  };
}

// Mock story generation functions
function mockGenerateSessionStory(settings: StorySettings, wordCount: number): string {
  const genres = settings.genre.join(', ');
  
  return `
# The Adventure Begins

In a world where anything seemed possible, Alex stood at the edge of the mountain trail, gazing into the vast expanse before them. The sunrise painted the sky with hues of orange and pink, promising a new day filled with challenges and rewards. This was going to be no ordinary journey.

As the cool morning air filled their lungs, Alex adjusted the backpack straps and took the first step forward. Each movement was deliberate, each breath measured. The path ahead twisted through dense forest and open meadows, a perfect metaphor for the journey of life itself.

"One step at a time," Alex whispered, repeating the mantra that had carried them through countless challenges before.

## The Forest Path

The trail soon led into a dense forest where sunlight filtered through the canopy, creating dappled patterns on the ground. The scent of pine and earth filled the air as Alex maintained a steady pace.

"Keep pushing," came the inner voice, stronger with each step forward.

Small woodland creatures scurried away as Alex moved through their territory, a reminder that everyone has their own path, their own journey to complete.

The forest gradually thinned, revealing a steep incline ahead. Alex's muscles tensed in anticipation, ready for the challenge that would push both body and mind to their limits.

## The Ascent

The climb was relentless. Rocks shifted beneath Alex's feet as the trail grew steeper. Sweat beaded on their forehead despite the cool mountain air. Yet with each difficult step, a sense of accomplishment grew stronger.

"This is what I trained for," Alex thought, feeling the familiar burn in their muscles, the quickening of breath, the steady rhythm of their heart.

At times, the path seemed to disappear entirely, forcing Alex to make choices, to forge ahead into the unknown. Isn't that what life was all about? Finding your way when the path wasn't clear?

## The Summit

Finally, after what seemed like hours of climbing, Alex reached a plateau. The view was breathtaking—mountains extending beyond the horizon, valleys carved by ancient rivers, clouds floating below like a sea of white.

Alex sat on a sun-warmed rock, taking deep breaths, allowing their heart rate to slow. This moment of rest was well-earned, but the journey was far from over.

The descent would bring its own challenges. Different muscles would ache, different skills would be tested. But that was for later. For now, there was only this perfect moment of achievement, of being exactly where they needed to be.

## The Return

The journey back always seemed quicker, Alex had noticed on previous adventures. Perhaps it was familiarity with the trail, or perhaps it was the pull of home that quickened one's steps.

As Alex navigated the descent, careful to avoid loose stones and slippery patches, thoughts turned to the next challenge, the next mountain to climb. That was the beauty of growth—there was always another summit waiting, another opportunity to push beyond perceived limitations.

The forest welcomed Alex back with its cool shade and gentle sounds. Birds called to one another overhead, and somewhere in the distance, water trickled over rocks. These simple pleasures meant so much more after the exertion of the climb.

## Homecoming

As the trail finally leveled out, Alex felt a profound sense of completion, of having come full circle. This journey, like all journeys, had changed them in subtle ways—strengthened muscles, sharpened focus, deepened resolve.

Tomorrow would bring new challenges, new mountains to climb. But for now, Alex had proven once again that with determination and perseverance, any summit could be reached.

The final steps of the trail brought Alex back to the starting point, but not as the same person who had set out hours earlier. Every journey leaves its mark, every challenge overcome builds character.

And that was the true reward of any adventure—not just reaching the destination, but becoming more through the journey itself.
`;
}

function mockGenerateSetStory(settings: StorySettings, wordCount: number, setIndex: number, totalSets: number): string {
  const genres = settings.genre.join(', ');
  
  if (setIndex === 0) {
    // First set intro
    return `
# The Challenge Begins

The ancient temple stood before Maya, its stone facade weathered by centuries of rain and wind. She had trained for months for this moment, studying the legends, preparing her body and mind for the trials that awaited inside.

"The Temple of Five Trials," she whispered, the words carrying on the gentle breeze. According to the manuscripts, only those who completed all five challenges would discover the temple's greatest secret.

Maya took a deep breath, centered herself, and stepped through the massive doorway. The stone door slid closed behind her with a definitive thud, sealing her inside. There was no turning back now.

The first chamber was dimly lit by torches that seemed to ignite spontaneously as she entered. In the center of the room stood a stone pedestal with ancient writing carved into its surface.

"To proceed, prove your strength is matched only by your endurance," Maya read aloud, translating the script.

Suddenly, the floor began to tremble. Sections of the stone shifted, creating an obstacle course of varying platforms at different heights. Maya understood immediately—this was the first trial.

She began moving through the course, jumping from platform to platform, some stable, others shifting under her weight. Her muscles burned with exertion, but her training served her well as she navigated the increasingly challenging path.

With a final leap, Maya landed on a solid platform that glowed with a soft blue light. The trembling stopped, and a doorway appeared in the far wall, leading deeper into the temple.

"One down," she said, catching her breath. "Four to go."
`;
  } else if (setIndex === totalSets - 1) {
    // Final set conclusion
    return `
# The Final Challenge

Maya stood before the entrance to the fifth and final chamber, her body tired but her spirit unbroken. She had overcome four grueling trials, each testing different aspects of her physical and mental abilities.

"This is it," she told herself, pressing her palm against the warm stone door. It recognized her touch as that of a worthy challenger and slowly swung open.

Unlike the previous chambers, this one was flooded with light from an opening in the ceiling. In the center stood not an obstacle or puzzle, but a simple meditation cushion placed before a small pool of crystal-clear water.

Confused but intrigued, Maya approached and sat on the cushion. The water in the pool began to shimmer, and a voice seemed to emanate from everywhere and nowhere.

"The final trial is not of the body, but of the mind," it said. "You must quiet your thoughts and find perfect stillness within."

Maya closed her eyes and focused on her breathing, drawing on the meditation techniques she had practiced for years. It was challenging to calm her racing heart and excited mind after the physical exertion of the previous chambers, but gradually, she found her center.

As her breathing slowed and her thoughts cleared, the pool before her began to glow with an intense light. Images formed on its surface—visions of ancient knowledge, forgotten techniques, and wisdom long lost to time.

Maya remained in this state for what could have been minutes or hours, absorbing the knowledge being shared with her. When she finally opened her eyes, she understood what made this temple truly special.

The greatest secret wasn't a physical treasure or a magical artifact. It was knowledge—the understanding that true mastery comes from balance between physical prowess and mental discipline.

As the final chamber's door opened to reveal the exit from the temple, Maya rose with new purpose. She wasn't leaving with empty hands, but with a full mind and spirit.

Outside, the sun was setting, casting long shadows across the landscape. Maya took a deep breath of the fresh air and smiled. Her journey wasn't ending here—it was just beginning.
`;
  } else {
    // Middle set - with cliffhanger
    return `
# The Third Chamber

Maya wiped sweat from her brow as she entered the third chamber of the temple. The previous trials had tested her strength and agility; she wondered what challenge awaited her now.

This room was larger than the others, with a high ceiling that disappeared into shadows. The air felt cooler here, with a slight mist that seemed to emanate from the walls themselves.

At the center of the chamber was a series of concentric rings carved into the floor, each one separated by shallow channels of flowing water. In the very middle stood a gleaming object that Maya couldn't quite make out from the entrance.

"The third trial tests your focus and precision," came a voice that seemed to resonate from the walls themselves. "Cross the rings without touching the water, and the prize is yours."

Maya approached the outer edge of the first ring. What looked simple from a distance proved much more complex up close. The stone rings were narrow, barely wide enough for her feet, and they rotated slowly in alternating directions.

She took a deep breath, centered herself, and stepped onto the first ring. It shifted slightly under her weight, but she maintained her balance. One down, several more to go.

The second ring moved faster than the first, requiring her to time her step perfectly. Too soon, and she'd miss; too late, and she might lose balance.

With a perfectly timed leap, Maya landed on the second ring. She could feel her heart pounding, but her focus remained unwavering. The third ring was moving even faster, in the opposite direction.

Maya continued her careful progression, each ring presenting a new challenge. Some moved unexpectedly, others tilted when she placed her weight on them. Her muscles burned from the precise control required, but she pushed through the discomfort.

As she approached the innermost ring, she could finally see what awaited her at the center: a small, blue crystal that seemed to pulse with its own inner light.

With one final, perfectly executed step, Maya landed on the central platform. The rings stopped moving, and the crystal rose into the air, hovering at eye level before her.

"Well done," said the voice. "You have proven your precision and focus. Take the Crystal of Clarity as proof of your accomplishment."

As Maya reached for the crystal, the floor beneath her suddenly began to shake violently...
`;
  }
}

function mockGenerateIntervalStory(
  settings: StorySettings, 
  wordCount: number, 
  setIndex: number, 
  totalSets: number,
  intervalIndex: number,
  totalIntervals: number,
  intervalLabel: string
): string {
  const genres = settings.genre.join(', ');
  
  // Create a mini-story appropriate for a single exercise interval
  return `
## ${intervalLabel}

The ${intervalLabel} challenge required every ounce of strength and focus. As sweat beaded on her forehead, Maya pushed through the burning sensation in her muscles, knowing that each moment of exertion brought her closer to mastery.

"Mind over matter," she repeated to herself with each movement, finding rhythm in the challenge. The ancient masters had designed these trials to forge not just stronger bodies, but unbreakable spirits.
`;
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).length;
}
