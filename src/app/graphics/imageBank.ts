import abomination from '../../assets/tokens/Abomination.png';
import antiquarian from '../../assets/tokens/Antiquarian.png';
import arbalist from '../../assets/tokens/Arbalist.png';
import bountyHunter from '../../assets/tokens/Bounty_Hunter.png';
import crusader from '../../assets/tokens/Crusader.png';
import graveRobber from '../../assets/tokens/Grave_Robber.png';
import hellion from '../../assets/tokens/Hellion.png';
import highwayman from '../../assets/tokens/Highwayman.png';
import houndmaster from '../../assets/tokens/Houndmaster.png';
import jester from '../../assets/tokens/Jester.png';
import leper from '../../assets/tokens/Leper.png';
import manAtArms from '../../assets/tokens/Man-at-Arms.png';
import musketeer from '../../assets/tokens/Musketeer.png';
import occultest from '../../assets/tokens/Occultist.png';
import plagueDoctor from '../../assets/tokens/Plague_Doctor.png';
import vestal from '../../assets/tokens/Vestal.png';

import boneRabble from '../../assets/tokens/Bone_Rabble.png';
import ancestor from '../../assets/tokens/Ancestor.png';
import banditBloodletter from '../../assets/tokens/Bandit_Bloodletter.png';
import banditFuselier from '../../assets/tokens/Bandit_Fuselier.png';
import banditCutthroat from '../../assets/tokens/Bandit_Cutthroat.png';
import slime from '../../assets/tokens/Slime.png';
import largeSlime from '../../assets/tokens/Large_Slime.png';
import webber from '../../assets/tokens/Webber.png';
import spitter from '../../assets/tokens/Spitter.png';
import carrionEater from '../../assets/tokens/Carrion_Eater.png';
import fungalScratcher from '../../assets/tokens/Fungal_Scratcher.png';
import fungalArtillery from '../../assets/tokens/Fungal_Artillery.png';
import fungusGiant from '../../assets/tokens/Fungus_Giant.png';
import gnasher from '../../assets/tokens/Gnasher.png';
import cultistBrawler from '../../assets/tokens/Cultist_Brawler.png';
import cultistAcolyte from '../../assets/tokens/Cultist_Acolyte.png';
import boneSoldier from '../../assets/tokens/Bone_Soldier.png';
import boneDefender from '../../assets/tokens/Bone_Defender.png';
import boneArbalist from '../../assets/tokens/Bone_Arbalist.png';
import boneCourtier from '../../assets/tokens/Bone_Courtier.png';
import madman from '../../assets/tokens/Madman.png';
import goul from '../../assets/tokens/Ghoul.png';
import gargoyle from '../../assets/tokens/Gargoyle.png';
import collectedRogue from '../../assets/tokens/Collected_Rogue.png';
import collectedCleric from '../../assets/tokens/Collected_Cleric.png';
import collectedWarrior from '../../assets/tokens/Collected_Warrior.png';
import collector from '../../assets/tokens/Collector.png';
import prophet from '../../assets/tokens/Prophet.png';
import crone from '../../assets/tokens/Crone.png';

import palette from '../../assets/icons/palette.svg';

export class ImageBank {
    static getImageUrl(imageName: string): string {
        switch(imageName)
        {
            case 'abomination': return abomination;
            case 'antiquarian': return antiquarian;
            case 'arbalist': return arbalist;
            case 'bounty_hunter': return bountyHunter;
            case 'crusader': return crusader;
            case 'grave_robber': return graveRobber;
            case 'hellion': return hellion;
            case 'highwayman': return highwayman;
            case 'houndmaster': return houndmaster;
            case 'jester': return jester;
            case 'leper': return leper;
            case 'man_at_arms': return manAtArms;
            case 'musketeer': return musketeer;
            case 'occultist': return occultest;
            case 'plague_doctor': return plagueDoctor;
            case 'vestal': return vestal;
            case 'bone_rabble': return boneRabble;
            case 'ancestor': return ancestor;
            case 'bandit_bloodletter': return banditBloodletter;
            case 'bandit_fuselier': return banditFuselier;
            case 'bandit_cutthroat': return banditCutthroat;
            case 'slime': return slime;
            case 'large_slime': return largeSlime;
            case 'webber': return webber;
            case 'spitter': return spitter;
            case 'carrion_eater': return carrionEater;
            case 'fungal_scratcher': return fungalScratcher;
            case 'fungal_artillery': return fungalArtillery;
            case 'fungus_giant': return fungusGiant;
            case 'gnasher': return gnasher;
            case 'cultist_brawler': return cultistBrawler;
            case 'cultist_acolyte': return cultistAcolyte;
            case 'bone_soldier': return boneSoldier;
            case 'bone_defender': return boneDefender;
            case 'bone_arbalist': return boneArbalist;
            case 'bone_courtier': return boneCourtier;
            case 'madman': return madman;
            case 'goul': return goul;
            case 'gargoyle': return gargoyle;
            case 'collected_rogue': return collectedRogue;
            case 'collected_cleric': return collectedCleric;
            case 'collected_warrior': return collectedWarrior;
            case 'collector': return collector;
            case 'prophet': return prophet;
            case 'palette': return palette;
            case 'crone': return crone;
            default: return ancestor;
        }
    }
}