import { StorySettings, StorySession } from '@/types';
import { textToSpeech, createAudioUrl } from './ttsService';

/**
 * Generate story and convert to audio 
 */
export const generateStory = async (settings: StorySettings): Promise<StorySession> => {
  try {
    // Calculate total duration including pauses for interval mode
    const intervalPauseTotal = settings.isIntervalMode 
      ? (settings.intervalCount - 1) * (settings.pauseDurationSeconds / 60) 
      : 0;
      
    // Calculate actual workout time (excluding pauses)
    const totalDurationMinutes = settings.isIntervalMode 
      ? settings.intervalCount * settings.intervalDurationMinutes 
      : settings.durationMinutes;
    
    const targetWordCount = Math.round(totalDurationMinutes * 140);
    
    // Generate story text (currently using mock)
    const prompt = createStoryPrompt(settings, targetWordCount);
    const storyText = await mockGenerateStory(prompt, settings);
    
    // Convert text to speech using Google Cloud TTS API
    let audioUrl = null;
    try {
      // Map language code from settings to expected Google TTS format
      const languageCode = mapLanguageCode(settings.language);
      
      const ttsResponse = await textToSpeech({
        text: storyText,
        languageCode: languageCode
      });
      
      // Convert base64 audio to URL
      audioUrl = createAudioUrl(ttsResponse.audioContent);
    } catch (error) {
      console.error('TTS conversion failed:', error);
      // Continue with null audio URL if TTS fails
    }

    // Create session object
    const newSession: StorySession = {
      id: generateId(),
      durationMinutes: totalDurationMinutes + intervalPauseTotal,
      genre: settings.genre,
      language: settings.language,
      storyText: storyText,
      storyAudioUrl: audioUrl,
      wordCount: countWords(storyText),
      isIntervalMode: settings.isIntervalMode,
      intervalCount: settings.intervalCount,
      intervalDurationMinutes: settings.intervalDurationMinutes,
      pauseDurationSeconds: settings.pauseDurationSeconds,
      createdAt: new Date(),
    };

    return newSession;
  } catch (error) {
    console.error('Story generation failed:', error);
    throw error;
  }
};

/**
 * Map app language code to Google TTS language code format
 */
const mapLanguageCode = (language: string): string => {
  const langMap: Record<string, string> = {
    'en': 'en-US',
    'es': 'es-ES',
    'fr': 'fr-FR',
    'de': 'de-DE',
    'it': 'it-IT'
  };
  
  return langMap[language] || 'en-US';
};

// Helper functions moved from useStorySession
function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).length;
}

function createStoryPrompt(settings: StorySettings, targetWordCount: number): string {
  const { genre, language, isIntervalMode, intervalCount } = settings;
  
  let prompt = `Write a captivating short story`;
  
  if (genre.length > 0) {
    if (genre.length === 1) {
      prompt += ` in the ${genre[0].toLowerCase()} genre`;
    } else {
      const lastGenre = genre[genre.length - 1];
      const otherGenres = genre.slice(0, -1).map(g => g.toLowerCase());
      prompt += ` that combines elements of ${otherGenres.join(', ')} and ${lastGenre.toLowerCase()}`;
    }
  }
  
  if (isIntervalMode) {
    prompt += ` with exactly ${intervalCount} chapters of equal length`;
  }
  
  prompt += `. The total word count should be approximately ${targetWordCount} words.`;
  prompt += ` The story should be engaging, immersive, and suitable for listening to during a workout.`;
  
  return prompt;
}

// Mock story generation (keeping the existing functions from useStorySession)
async function mockGenerateStory(prompt: string, settings: StorySettings): Promise<string> {
  await new Promise(resolve => setTimeout(resolve, 3000)); // Simulate API delay
  
  const isIntervalMode = settings.isIntervalMode;
  const intervalCount = settings.intervalCount;
  
  let story = "";
  
  // Generate a different story based on the genres
  const genres = settings.genre.map(g => g.toLowerCase());
  const primaryGenre = genres[0] || "adventure";
  
  if (isIntervalMode) {
    for (let i = 1; i <= intervalCount; i++) {
      story += `Chapter ${i}\n\n`;
      
      if (genres.includes("adventure") || genres.includes("fantasy")) {
        story += `The journey continued as our hero faced the ${i === intervalCount ? 'final' : i === 1 ? 'first' : i === 2 ? 'second' : 'next'} challenge. `;
        story += mockStorySegment(primaryGenre, 120); // Shorter segment for each interval
        story += "\n\n";
      } else if (genres.includes("science fiction")) {
        story += `The ${i === intervalCount ? 'final phase' : `phase ${i}`} of the mission began with an unexpected discovery. `;
        story += mockStorySegment(primaryGenre, 120);
        story += "\n\n";
      } else {
        story += mockStorySegment(primaryGenre, 140);
        story += "\n\n";
      }
    }
  } else {
    // Single continuous story
    const totalWordCount = settings.durationMinutes * 140;
    
    // Generate an intro that incorporates all selected genres
    let intro = "In a world where ";
    if (genres.includes("science fiction") && genres.includes("fantasy")) {
      intro += "technology and magic coexisted, ";
    } else if (genres.includes("adventure") && genres.includes("mystery")) {
      intro += "every journey contained hidden secrets, ";
    } else if (genres.includes("horror") && genres.includes("thriller")) {
      intro += "fear lurked around every corner, ";
    } else {
      intro += "anything was possible, ";
    }
    
    story = intro + mockStorySegment(primaryGenre, totalWordCount - 10);
  }
  
  return story;
}

function mockStorySegment(genre: string, wordCount: number): string {
  // These are placeholder story segments from useStorySession
  const segments: Record<string, string[]> = {
    "adventure": [
      "The mountain trail twisted ahead, challenging Emma with each step. Her backpack felt heavier today, but the promise of reaching the summit before sunset kept her pushing forward. The forest around her buzzed with life, birds calling overhead as dappled sunlight broke through the canopy. She paused at a clearing, catching her breath while checking her map. The final ascent would be the steepest, but the view would be worth every aching muscle. As she adjusted her hiking poles and took a swig of water, Emma noticed something unusual—a faint path branching off from the main trail, barely visible among the ferns and undergrowth. It wasn't marked on her map. Curiosity piqued, she hesitated only briefly before stepping onto the mysterious path. Adventure, after all, meant embracing the unexpected.",
      "The cave entrance loomed before Marcus, a dark mouth in the cliff face that seemed to exhale cool, damp air. His headlamp cut a weak beam into the darkness, revealing glimpses of stalactites hanging from the ceiling like stone teeth. The expedition had taken weeks to prepare, but now, standing at the threshold of the unexplored cavern, doubt crept in. The local legends about this place were probably just stories, he told himself, tightening the straps on his gear. With a deep breath, Marcus stepped into the darkness, the sound of water dripping somewhere in the distance serving as his only guide. Each careful step took him deeper into the earth, where no one had ventured before. The narrow passage suddenly widened, and his light couldn't reach the far walls of what must have been an enormous chamber. As the beam swept across the floor, something reflected back—not the dull gleam of wet stone, but a metallic glint that didn't belong in this untouched place."
    ],
    "fantasy": [
      "In the village of Elderwood, where the trees whispered secrets and the river sang ancient songs, lived a young woman named Lyra who could speak to shadows. Not the ordinary shadows cast by objects in sunlight, but the deeper, older shadows that lingered in forgotten corners and hidden places. They told her stories of distant lands and times long past, sharing wisdom that had slipped from human memory. On the eve of the summer solstice, when the veil between worlds grew thin, the shadows grew restless. They swirled around Lyra as she walked home under the twilight sky, their voices more urgent than she had ever heard them. Something was coming, they warned—something that had slept beneath the mountains for a thousand years and now stirred, stretching its ancient power toward the surface world. The village elders dismissed her warnings as fantasy, but Lyra knew better. As darkness fell completely, she packed a small bag and slipped out her bedroom window, following the whispered guidance of her shadowy companions toward the distant mountains, where fate awaited."
    ],
    "science fiction": [
      "Dr. Eliza Chen stared at the data scrolling across her holographic display, the blue light illuminating her face in the dim laboratory. The quantum readings defied conventional physics—particles communicating across vast distances instantly, as if space itself meant nothing to them. She had discovered something fundamental about reality, something that could revolutionize space travel. If particles could communicate instantly across any distance, perhaps ships could too. The implications were staggering: instantaneous travel between star systems, no more decades-long journeys in cryosleep. Humanity could truly become an interstellar species. But as she prepared to transmit her findings to the United Earth Science Council, a message appeared on her screen from an unknown source: 'Some discoveries are not meant for humans yet.' The laboratory door sealed with a hiss, and the ventilation system switched off. Eliza felt a cold shiver run down her spine as she realized she wasn't alone in the station anymore. Something—or someone—had been watching her work, perhaps all along."
    ],
    "mystery": [
      "Detective Morgan Reed stood in the rain-soaked garden, water dripping from the brim of her hat as she examined the ornate key found clutched in the victim's hand. It matched no lock in the house—she'd already checked every door, cabinet, and box. The victim, renowned historian Dr. Harrison Wells, had no enemies according to his colleagues, yet here he lay, in his own garden, clutching a mysterious key. The house itself was a historian's dream: a Victorian mansion filled with artifacts and books, each room a testament to a different era. But it was the study that drew Morgan's attention, with its walls lined with maps of places that didn't exist and photographs of people whose faces had been carefully scratched out. As the forensic team worked around her, Morgan noticed a pattern in the bookshelves—certain volumes protruded slightly more than others. When she pulled one out, she found a symbol drawn on the wall behind it, identical to the one engraved on the mysterious key. The historian had hidden something, and it had cost him his life."
    ],
    "horror": [
      "The house at the end of Elm Street had been empty for decades, its windows like vacant eyes watching the neighborhood. When the Sullivan family moved in after buying it at auction, neighbors whispered about the house's past but never directly to the newcomers. Madison Sullivan, sixteen and resentful about leaving her friends behind, found herself drawn to the strange symbols carved into her bedroom closet door. They weren't obvious at first—just faint lines that caught the light at certain angles—but once she noticed them, she couldn't unsee them. Late at night, she thought she heard whispering from behind that door, even though the closet was barely deep enough for her clothes. One night, unable to sleep and annoyed by the persistent whispers, she opened the closet door forcefully, ready to prove to herself it was just the wind or the old house settling. Instead, she found the closet stretched impossibly backward, a long dark corridor where the wall should have been. And from somewhere in that impossible darkness, something was calling her name."
    ],
    "motivational": [
      "Every morning for the past five years, Kai had watched the sunrise from the same bench in Memorial Park. It wasn't about the view—though the golden light spilling over the city skyline was breathtaking. It was about remembering how far he'd come. Five years ago, he couldn't walk to this bench without assistance. The doctors had said he might never walk independently again after the accident, but here he was, standing by himself on the hillside, his cane leaning unused against the bench. The journey had been grueling—countless hours of physical therapy, days when pain made even breathing seem impossible, moments of despair when giving up felt like the only sensible option. But with each small victory—wiggling his toes again, standing for ten seconds, taking his first unassisted step—Kai had rebuilt not just his body but his understanding of what human determination could achieve. As today's sun cleared the horizon, painting the clouds in brilliant orange and pink, Kai took a deep breath and smiled. Tomorrow, he would start training for the 5K he'd promised himself he'd run one day. The impossible just took a little longer."
    ]
  };

  // Default to adventure if genre not found
  const genreSegments = segments[genre] || segments["adventure"];
  
  // Select a random segment from the genre
  const randomSegment = genreSegments[Math.floor(Math.random() * genreSegments.length)];
  
  return randomSegment;
}
