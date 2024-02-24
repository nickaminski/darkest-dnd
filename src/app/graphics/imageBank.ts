import hellionImage from '../../assets/tokens/Hellion.png';
import highwaymanImage from '../../assets/tokens/Highwayman.png';
import jesterImage from '../../assets/tokens/Jester.png';
import occultestImage from '../../assets/tokens/Occultist.png';
import boneRabbleImage from '../../assets/tokens/Bone_Rabble.png';
import ancestorImage from '../../assets/tokens/Ancestor.png';

export class ImageBank {
    static getImageUrl(imageName: string): string {
        switch(imageName)
        {
            case 'ancestor': return ancestorImage;
            case 'bone_rabble': return boneRabbleImage;
            case 'hellion': return hellionImage;
            case 'highwayman': return highwaymanImage;
            case 'jester': return jesterImage;
            case 'occultest': return occultestImage;
            default: return ancestorImage;
        }
    }
}