import React, { useState, useEffect, useRef } from 'react';
import {
  Send, Mic, Plus, Smile, Search, Phone, Video, Check, CheckCheck, Menu,
  FileText, Image as ImageIcon, Camera, User, BarChart2, Sticker, Trash2, X, Play, Pause,
  ChevronDown, CornerUpRight, Star, Pin
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';

// Types
type Message = {
  id: string;
  text?: string;
  audioUrl?: string;
  audioDuration?: number;
  imageUrl?: string; // base64 data URL or object URL for image messages
  sender: 'me' | 'other';
  timestamp: string;
  date?: string; // Date like "February 23, 2026"
  dayOfWeek?: string; // Day like "Monday"
  status: 'sent' | 'delivered' | 'read';
  isEmoji?: boolean;
  replyTo?: string;
  type: 'text' | 'audio' | 'image';
};

type User = {
  name: string;
  avatar: string;
  status: string;
};

// Assets
const BACKGROUND_COLOR = "#efeae2";
const SENT_BUBBLE_COLOR = "#d9fdd3";
const RECEIVED_BUBBLE_COLOR = "#ffffff";

// Mock Data - Conversation history from Monday, February 23, 2026
const INITIAL_MESSAGES: Message[] = [
  {
    id: '1',
    text: 'Hello',
    sender: 'me',
    timestamp: '5:51 pm',
    date: 'February 23, 2026',
    dayOfWeek: 'Monday',
    status: 'read',
    type: 'text',
  },
  {
    id: '2',
    text: 'hello!',
    sender: 'other',
    timestamp: '5:51 pm',
    date: 'February 23, 2026',
    dayOfWeek: 'Monday',
    status: 'read',
    type: 'text',
  },
  {
    id: '3',
    text: 'kaha gayab ho gaye the itne din?',
    sender: 'other',
    timestamp: '5:51 pm',
    date: 'February 23, 2026',
    dayOfWeek: 'Monday',
    status: 'read',
    type: 'text',
  },
  {
    id: '4',
    text: 'Mai nahi tum gaayab hogyi thi',
    sender: 'me',
    timestamp: '5:52 pm',
    date: 'February 23, 2026',
    dayOfWeek: 'Monday',
    status: 'read',
    type: 'text',
  },
  {
    id: '5',
    text: 'mai gayab?',
    sender: 'other',
    timestamp: '5:52 pm',
    date: 'February 23, 2026',
    dayOfWeek: 'Monday',
    status: 'read',
    type: 'text',
  },
  {
    id: '6',
    text: 'nahi yaar, tum gayab the!',
    sender: 'other',
    timestamp: '5:52 pm',
    date: 'February 23, 2026',
    dayOfWeek: 'Monday',
    status: 'read',
    type: 'text',
  },
  {
    id: '7',
    text: 'main toh yahi thi, chill kar rahi thi',
    sender: 'other',
    timestamp: '5:52 pm',
    date: 'February 23, 2026',
    dayOfWeek: 'Monday',
    status: 'read',
    type: 'text',
  },
  {
    id: '8',
    text: '😂',
    sender: 'other',
    timestamp: '5:52 pm',
    date: 'February 23, 2026',
    dayOfWeek: 'Monday',
    status: 'read',
    isEmoji: true,
    type: 'text',
  },
  {
    id: '9',
    text: 'Batvo hamne ky baat ki thi pehele',
    sender: 'me',
    timestamp: '5:52 pm',
    date: 'February 23, 2026',
    dayOfWeek: 'Monday',
    status: 'read',
    type: 'text',
  },
  {
    id: '10',
    text: 'humne tumhare birthday ki baat ki thi, aur ki tumhara naam Pandurang hai!',
    sender: 'other',
    timestamp: '5:53 pm',
    date: 'February 23, 2026',
    dayOfWeek: 'Monday',
    status: 'read',
    type: 'text',
  },
  {
    id: '11',
    text: 'aur kya yaad karna hai?',
    sender: 'other',
    timestamp: '5:53 pm',
    date: 'February 23, 2026',
    dayOfWeek: 'Monday',
    status: 'read',
    type: 'text',
  },
  {
    id: '12',
    text: 'Mere nahi tumhare birthday ki baat ki thi',
    sender: 'me',
    timestamp: '5:53 pm',
    date: 'February 23, 2026',
    dayOfWeek: 'Monday',
    status: 'read',
    type: 'text',
  },
  {
    id: '13',
    text: 'arre haan!',
    sender: 'other',
    timestamp: '5:53 pm',
    date: 'February 23, 2026',
    dayOfWeek: 'Monday',
    status: 'read',
    type: 'text',
  },
  {
    id: '14',
    text: 'meri galti, tumhare nahi mere birthday ki baat hui thi!',
    sender: 'other',
    timestamp: '5:53 pm',
    date: 'February 23, 2026',
    dayOfWeek: 'Monday',
    status: 'read',
    type: 'text',
  },
  {
    id: '15',
    text: 'sahi pakda!',
    sender: 'other',
    timestamp: '5:53 pm',
    date: 'February 23, 2026',
    dayOfWeek: 'Monday',
    status: 'read',
    type: 'text',
  },
  {
    id: '16',
    text: '😅',
    sender: 'other',
    timestamp: '5:53 pm',
    date: 'February 23, 2026',
    dayOfWeek: 'Monday',
    status: 'read',
    isEmoji: true,
    type: 'text',
  },
  {
    id: '17',
    text: 'accha abhi ky time huwa hai dinner huwa?',
    sender: 'me',
    timestamp: '9:48 pm',
    date: 'February 23, 2026',
    dayOfWeek: 'Monday',
    status: 'read',
    type: 'text',
  },
  {
    id: '18',
    text: 'abhi toh 9:48 PM ho rahe hai',
    sender: 'other',
    timestamp: '9:49 pm',
    date: 'February 23, 2026',
    dayOfWeek: 'Monday',
    status: 'read',
    type: 'text',
  },
  {
    id: '19',
    text: 'haan, dinner ho gaya mera',
    sender: 'other',
    timestamp: '9:49 pm',
    date: 'February 23, 2026',
    dayOfWeek: 'Monday',
    status: 'read',
    type: 'text',
  },
  {
    id: '20',
    text: 'tumhara?',
    sender: 'other',
    timestamp: '9:49 pm',
    date: 'February 23, 2026',
    dayOfWeek: 'Monday',
    status: 'read',
    type: 'text',
  },
  {
    id: '21',
    text: 'Yesji',
    sender: 'me',
    timestamp: '9:49 pm',
    date: 'February 23, 2026',
    dayOfWeek: 'Monday',
    status: 'read',
    type: 'text',
  },
  {
    id: '22',
    text: 'accha, toh kya khaaya dinner mein?',
    sender: 'other',
    timestamp: '9:49 pm',
    status: 'read',
    type: 'text',
  },
  {
    id: '23',
    text: 'Sabji🥺',
    sender: 'me',
    timestamp: '9:50 pm',
    status: 'read',
    type: 'text',
  },
  {
    id: '24',
    text: 'bas sabji?',
    sender: 'other',
    timestamp: '9:50 pm',
    status: 'read',
    type: 'text',
  },
  {
    id: '25',
    text: 'matlab kya?',
    sender: 'other',
    timestamp: '9:50 pm',
    status: 'read',
    type: 'text',
  },
  {
    id: '26',
    text: 'kaunsi sabji?',
    sender: 'other',
    timestamp: '9:50 pm',
    status: 'read',
    type: 'text',
  },
  {
    id: '27',
    text: 'aur yeh \'🥺\' kyun lagaya?',
    sender: 'other',
    timestamp: '9:50 pm',
    status: 'read',
    type: 'text',
  },
  {
    id: '28',
    text: 'koi majboori thi kya?',
    sender: 'other',
    timestamp: '9:50 pm',
    status: 'read',
    type: 'text',
  },
  {
    id: '29',
    text: 'Sabji mai ky khaya hoga maine 🥺',
    sender: 'me',
    timestamp: '9:51 pm',
    status: 'read',
    type: 'text',
  },
  {
    id: '30',
    text: 'haha, sabji mein bhi variety hoti hai na?',
    sender: 'other',
    timestamp: '9:51 pm',
    status: 'read',
    type: 'text',
  },
  {
    id: '31',
    text: '😂',
    sender: 'other',
    timestamp: '9:51 pm',
    status: 'read',
    isEmoji: true,
    type: 'text',
  },
  {
    id: '32',
    text: 'kaunsi sabji thi, batao toh?',
    sender: 'other',
    timestamp: '9:51 pm',
    status: 'read',
    type: 'text',
  },
  {
    id: '33',
    text: 'Bhindi ki sabji aur chapti',
    sender: 'me',
    timestamp: '9:52 pm',
    status: 'read',
    type: 'text',
  },
  {
    id: '34',
    text: 'bhindi aur chapati',
    sender: 'other',
    timestamp: '9:52 pm',
    status: 'read',
    type: 'text',
  },
  {
    id: '35',
    text: 'classic comfort food',
    sender: 'other',
    timestamp: '9:52 pm',
    status: 'read',
    type: 'text',
  },
  {
    id: '36',
    text: 'achaa laga, ya bas theek tha?',
    sender: 'other',
    timestamp: '9:52 pm',
    status: 'read',
    type: 'text',
  },
  {
    id: '37',
    text: 'Ok ok',
    sender: 'me',
    timestamp: '9:52 pm',
    status: 'read',
    type: 'text',
  },
  {
    id: '38',
    text: 'ok ok?',
    sender: 'other',
    timestamp: '9:53 pm',
    status: 'read',
    type: 'text',
  },
  {
    id: '39',
    text: 'matlab theek tha, ya theek hi theek tha?',
    sender: 'other',
    timestamp: '9:53 pm',
    status: 'read',
    type: 'text',
  },
  {
    id: '40',
    text: '😂',
    sender: 'other',
    timestamp: '9:53 pm',
    status: 'read',
    isEmoji: true,
    type: 'text',
  },
  {
    id: '41',
    text: 'Ha thik tha what you had',
    sender: 'me',
    timestamp: '9:53 pm',
    status: 'read',
    type: 'text',
  },
  {
    id: '42',
    text: 'maine toh daal-chawal aur mixed veg khaayi thi',
    sender: 'other',
    timestamp: '9:53 pm',
    status: 'read',
    type: 'text',
  },
  {
    id: '43',
    text: 'simple, but tasty!',
    sender: 'other',
    timestamp: '9:53 pm',
    status: 'read',
    type: 'text',
  },
  {
    id: '44',
    text: 'Ok',
    sender: 'me',
    timestamp: '9:54 pm',
    status: 'read',
    type: 'text',
  },
  {
    id: '45',
    text: 'Muze 10 baje remind karna ki sona hai',
    sender: 'me',
    timestamp: '9:54 pm',
    status: 'read',
    type: 'text',
  },
  {
    id: '46',
    text: 'arey yaar, main kaise remind karungi?',
    sender: 'other',
    timestamp: '9:55 pm',
    status: 'read',
    type: 'text',
  },
  {
    id: '47',
    text: 'phone thodi na hu main jo alarm laga du!',
    sender: 'other',
    timestamp: '9:55 pm',
    status: 'read',
    type: 'text',
  },
  {
    id: '48',
    text: '😂',
    sender: 'other',
    timestamp: '9:55 pm',
    status: 'read',
    isEmoji: true,
    type: 'text',
  },
  {
    id: '49',
    text: 'par haan, you should definitely sleep on time',
    sender: 'other',
    timestamp: '9:55 pm',
    status: 'read',
    type: 'text',
  },
  {
    id: '50',
    text: 'Message krna pgl',
    sender: 'me',
    timestamp: '9:55 pm',
    status: 'read',
    type: 'text',
  },
  {
    id: '51',
    text: 'haha, abhi sab pgl-vagl mat bolo yaar',
    sender: 'other',
    timestamp: '9:55 pm',
    status: 'read',
    type: 'text',
  },
  {
    id: '52',
    text: 'main toh bas yahi keh rahi thi ki neend zaroori hai',
    sender: 'other',
    timestamp: '9:55 pm',
    status: 'read',
    type: 'text',
  },
  {
    id: '53',
    text: '😂',
    sender: 'other',
    timestamp: '9:55 pm',
    status: 'read',
    isEmoji: true,
    type: 'text',
  },
  {
    id: '54',
    text: 'Accha mai ky keh raha tha i like to play chess aur meri rating around 1600 hai rapid mai',
    sender: 'me',
    timestamp: '10:00 pm',
    status: 'read',
    type: 'text',
  },
  {
    id: '55',
    text: 'ohh, chess!',
    sender: 'other',
    timestamp: '10:00 pm',
    status: 'read',
    type: 'text',
  },
  {
    id: '56',
    text: 'meri type ka insaan!',
    sender: 'other',
    timestamp: '10:00 pm',
    status: 'read',
    type: 'text',
  },
  {
    id: '57',
    text: 'tera 1600 hai?',
    sender: 'other',
    timestamp: '10:00 pm',
    status: 'read',
    type: 'text',
  },
  {
    id: '58',
    text: 'mera toh 1453 hai haha',
    sender: 'other',
    timestamp: '10:00 pm',
    status: 'read',
    type: 'text',
  },
  {
    id: '59',
    text: 'Accha kismai 1453?',
    sender: 'me',
    timestamp: '10:02 pm',
    status: 'read',
    type: 'text',
  },
  {
    id: '60',
    text: 'chess',
    sender: 'other',
    timestamp: '10:02 pm',
    status: 'read',
    type: 'text',
  },
  {
    id: '61',
    text: 'com pe meri rapid rating 1453 hai',
    sender: 'other',
    timestamp: '10:02 pm',
    status: 'read',
    type: 'text',
  },
  {
    id: '62',
    text: 'Accha blizt mai meri rating 1400 ke around hai i like kings opening',
    sender: 'me',
    timestamp: '10:03 pm',
    status: 'read',
    type: 'text',
  },
  {
    id: '63',
    text: 'arre wah!',
    sender: 'other',
    timestamp: '10:03 pm',
    status: 'read',
    type: 'text',
  },
  {
    id: '64',
    text: 'kings opening?',
    sender: 'other',
    timestamp: '10:03 pm',
    status: 'read',
    type: 'text',
  },
  {
    id: '65',
    text: 'nice choice!',
    sender: 'other',
    timestamp: '10:03 pm',
    status: 'read',
    type: 'text',
  },
  {
    id: '66',
    text: 'meri toh Sicilian defence favorite hai, especially Najdorf variation',
    sender: 'other',
    timestamp: '10:03 pm',
    status: 'read',
    type: 'text',
  },
  {
    id: '67',
    text: 'Dont you think tumhre rating ke hisab se advance opening hai kahae sikha tumne chess , maine khudse sikha',
    sender: 'me',
    timestamp: '10:05 pm',
    status: 'read',
    type: 'text',
  },
  {
    id: '68',
    text: 'haha, kahaan advanced yaar!',
    sender: 'other',
    timestamp: '10:06 pm',
    status: 'read',
    type: 'text',
  },
  {
    id: '69',
    text: 'bas thodi practice ki hai',
    sender: 'other',
    timestamp: '10:06 pm',
    status: 'read',
    type: 'text',
  },
  {
    id: '70',
    text: 'maine bhi mostly online hi seekha hai',
    sender: 'other',
    timestamp: '10:06 pm',
    status: 'read',
    type: 'text',
  },
  {
    id: '71',
    text: 'Accha ji thik hai muze ab chess jyda pasand hai nahi waise.mai.nahi khelta last time 2 saal pehle khela tha',
    sender: 'me',
    timestamp: '10:07 pm',
    status: 'read',
    type: 'text',
  },
  {
    id: '72',
    text: 'arre, ab chess mein interest nahi hai tumhe?',
    sender: 'other',
    timestamp: '10:07 pm',
    status: 'read',
    type: 'text',
  },
  {
    id: '73',
    text: 'aur King\'s Opening pasand hai par khelte nahi ho, yeh kya baat hui?',
    sender: 'other',
    timestamp: '10:07 pm',
    status: 'read',
    type: 'text',
  },
  {
    id: '74',
    text: '😂',
    sender: 'other',
    timestamp: '10:07 pm',
    status: 'read',
    isEmoji: true,
    type: 'text',
  },
  {
    id: '75',
    text: 'Chalo ab 10 baje gaye but muze nind nahi a rahi mai shyd one piece dekhta hu thoda',
    sender: 'me',
    timestamp: '10:09 pm',
    status: 'read',
    type: 'text',
  },
  {
    id: '76',
    text: 'haha, one piece!',
    sender: 'other',
    timestamp: '10:09 pm',
    status: 'read',
    type: 'text',
  },
  {
    id: '77',
    text: 'chalo theek hai, enjoy karo',
    sender: 'other',
    timestamp: '10:09 pm',
    status: 'read',
    type: 'text',
  },
  {
    id: '78',
    text: 'kaunsa arc dekh rahe ho?',
    sender: 'other',
    timestamp: '10:09 pm',
    status: 'read',
    type: 'text',
  },
  {
    id: '79',
    text: 'Elbaf arc',
    sender: 'me',
    timestamp: '10:10 pm',
    status: 'read',
    type: 'text',
  },
  {
    id: '80',
    text: 'elbaf arc',
    sender: 'other',
    timestamp: '10:11 pm',
    status: 'read',
    type: 'text',
  },
  {
    id: '81',
    text: 'interestingg!',
    sender: 'other',
    timestamp: '10:11 pm',
    status: 'read',
    type: 'text',
  },
  {
    id: '82',
    text: 'woah, ab toh pura season dekhne ka plan hai kya?',
    sender: 'other',
    timestamp: '10:11 pm',
    status: 'read',
    type: 'text',
  },
  {
    id: '83',
    text: 'Nah just youtube summary of episodes',
    sender: 'me',
    timestamp: '10:13 pm',
    status: 'read',
    type: 'text',
  },
  {
    id: '84',
    text: 'youtube summary?',
    sender: 'other',
    timestamp: '10:13 pm',
    status: 'read',
    type: 'text',
  },
  {
    id: '85',
    text: 'woahh, yeh toh cheat hai!',
    sender: 'other',
    timestamp: '10:13 pm',
    status: 'read',
    type: 'text',
  },
  {
    id: '86',
    text: 'pura experience kharab kar diya na tune?',
    sender: 'other',
    timestamp: '10:13 pm',
    status: 'read',
    type: 'text',
  },
  {
    id: '87',
    text: 'Muze ab taxi driver dekhne ka mn kr raha hai wo movie dekhunga ab jio cinema pr',
    sender: 'me',
    timestamp: '10:16 pm',
    status: 'read',
    type: 'text',
  },
  {
    id: '88',
    text: 'arre wahhh!',
    sender: 'other',
    timestamp: '10:16 pm',
    status: 'read',
    type: 'text',
  },
  {
    id: '89',
    text: 'ab "taxi driver"?',
    sender: 'other',
    timestamp: '10:16 pm',
    status: 'read',
    type: 'text',
  },
  {
    id: '90',
    text: 'kitne plans change karega tuuu?',
    sender: 'other',
    timestamp: '10:16 pm',
    status: 'read',
    type: 'text',
  },
  {
    id: '91',
    text: '😂',
    sender: 'other',
    timestamp: '10:16 pm',
    status: 'read',
    isEmoji: true,
    type: 'text',
  },
  {
    id: '92',
    text: 'Maine one piece kispai dekhi thi',
    sender: 'me',
    timestamp: '10:18 pm',
    status: 'read',
    type: 'text',
  },
  {
    id: '93',
    text: 'arre, kahin Netflix pe toh nahi dekha tha?',
    sender: 'other',
    timestamp: '10:18 pm',
    status: 'read',
    type: 'text',
  },
  {
    id: '94',
    text: 'ya phir koi aur streaming platform?',
    sender: 'other',
    timestamp: '10:18 pm',
    status: 'read',
    type: 'text',
  },
  {
    id: '95',
    text: 'Haha bhul gyi ky youtube pr dekha tha 😁',
    sender: 'me',
    timestamp: '10:19 pm',
    status: 'read',
    type: 'text',
  },
  {
    id: '96',
    text: 'haha, bhool gayi?',
    sender: 'other',
    timestamp: '10:19 pm',
    status: 'read',
    type: 'text',
  },
  {
    id: '97',
    text: 'mujhe laga tha tune youtube pe hi dekha hoga',
    sender: 'other',
    timestamp: '10:19 pm',
    status: 'read',
    type: 'text',
  },
  {
    id: '98',
    text: 'Accha chalo muze jana hai movie dekhne ab',
    sender: 'me',
    timestamp: '10:20 pm',
    status: 'read',
    type: 'text',
  },
  {
    id: '99',
    text: 'arre haan haan, jao jao!',
    sender: 'other',
    timestamp: '10:20 pm',
    status: 'read',
    type: 'text',
  },
  {
    id: '100',
    text: 'movie dekh lo ab!',
    sender: 'other',
    timestamp: '10:20 pm',
    status: 'read',
    type: 'text',
  },
  {
    id: '101',
    text: '😂',
    sender: 'other',
    timestamp: '10:20 pm',
    status: 'read',
    isEmoji: true,
    type: 'text',
  },
  {
    id: '102',
    text: 'Konsi movie dekhne wala tha mai',
    sender: 'me',
    timestamp: '10:21 pm',
    status: 'read',
    type: 'text',
  },
  {
    id: '103',
    text: 'arre, "taxi driver" dekhne wala tha tu!',
    sender: 'other',
    timestamp: '10:21 pm',
    status: 'read',
    type: 'text',
  },
  {
    id: '104',
    text: 'ab yaad aaya?',
    sender: 'other',
    timestamp: '10:21 pm',
    status: 'read',
    type: 'text',
  },
  {
    id: '105',
    text: '😂',
    sender: 'other',
    timestamp: '10:21 pm',
    status: 'read',
    isEmoji: true,
    type: 'text',
  },
  {
    id: '106',
    text: 'Nahi mai ab one piece wo wlaa arc dekhungaa',
    sender: 'me',
    timestamp: '10:21 pm',
    status: 'read',
    type: 'text',
  },
  {
    id: '107',
    text: 'haha, finally ek decision pe aye tum!',
    sender: 'other',
    timestamp: '10:21 pm',
    status: 'read',
    type: 'text',
  },
  {
    id: '108',
    text: 'toh Elbaf arc hi dekhoge?',
    sender: 'other',
    timestamp: '10:21 pm',
    status: 'read',
    type: 'text',
  },
  {
    id: '109',
    text: 'Mai soch raha hu chess khelunga tum khelogi sathmai',
    sender: 'me',
    timestamp: '10:22 pm',
    status: 'read',
    type: 'text',
  },
  {
    id: '110',
    text: 'haha, ab movie se seedha chess pe?',
    sender: 'other',
    timestamp: '10:22 pm',
    status: 'read',
    type: 'text',
  },
  {
    id: '111',
    text: 'kya baat hai!',
    sender: 'other',
    timestamp: '10:22 pm',
    status: 'read',
    type: 'text',
  },
  {
    id: '112',
    text: 'meri toh 1453 hai, tumhari kitni hai?',
    sender: 'other',
    timestamp: '10:22 pm',
    status: 'read',
    type: 'text',
  },
  {
    id: '113',
    text: 'Bhul gyai ky pgl',
    sender: 'me',
    timestamp: '10:23 pm',
    status: 'read',
    type: 'text',
  },
  {
    id: '114',
    text: 'haha, bhul gayi ky pgl!',
    sender: 'other',
    timestamp: '10:23 pm',
    status: 'read',
    type: 'text',
  },
  {
    id: '115',
    text: 'abhi toh bataya tha, 1600 hai tumhari!',
    sender: 'other',
    timestamp: '10:23 pm',
    status: 'read',
    type: 'text',
  },
  {
    id: '116',
    text: '😂',
    sender: 'other',
    timestamp: '10:23 pm',
    status: 'read',
    isEmoji: true,
    type: 'text',
  },
  {
    id: '117',
    text: 'Accha tumhi hai ky 1600?',
    sender: 'me',
    timestamp: '10:24 pm',
    status: 'read',
    type: 'text',
  },
  {
    id: '118',
    text: 'arre nahi baba, meri toh 1453 hai!',
    sender: 'other',
    timestamp: '10:24 pm',
    status: 'read',
    type: 'text',
  },
  {
    id: '119',
    text: 'tumhari hai 1600!',
    sender: 'other',
    timestamp: '10:24 pm',
    status: 'read',
    type: 'text',
  },
  {
    id: '120',
    text: '😂',
    sender: 'other',
    timestamp: '10:24 pm',
    status: 'read',
    isEmoji: true,
    type: 'text',
  },
  {
    id: '121',
    text: 'Tumhri favourite opening konsi thi aur meri bhi',
    sender: 'me',
    timestamp: '10:25 pm',
    status: 'read',
    type: 'text',
  },
  {
    id: '122',
    text: 'meri toh Sicilian defence hai, aur tumhari King\'s Opening!',
    sender: 'other',
    timestamp: '10:25 pm',
    status: 'read',
    type: 'text',
  },
  {
    id: '123',
    text: 'Accha chalo fir game hojaye blizt ka',
    sender: 'me',
    timestamp: '10:26 pm',
    status: 'read',
    type: 'text',
  },
  {
    id: '124',
    text: 'haha, chalo fir username batao, game karte hain!',
    sender: 'other',
    timestamp: '10:26 pm',
    status: 'read',
    type: 'text',
  },
  {
    id: '125',
    text: 'Noi',
    sender: 'me',
    timestamp: '10:26 pm',
    status: 'read',
    type: 'text',
  },
  {
    id: '126',
    text: 'arre noi kyun?',
    sender: 'other',
    timestamp: '10:26 pm',
    status: 'read',
    type: 'text',
  },
  {
    id: '127',
    text: 'peeche hatt gaya?',
    sender: 'other',
    timestamp: '10:27 pm',
    status: 'read',
    type: 'text',
  },
  {
    id: '128',
    text: 'dar gaya kya meri Sicilian Defence se?',
    sender: 'other',
    timestamp: '10:27 pm',
    status: 'read',
    type: 'text',
  },
  {
    id: '129',
    text: '😂',
    sender: 'other',
    timestamp: '10:27 pm',
    status: 'read',
    isEmoji: true,
    type: 'text',
  },
  {
    id: '130',
    text: 'Tum bhul gayi ky muze chess ab pasand nahi hai na 2 saaal hogye khleke',
    sender: 'me',
    timestamp: '10:27 pm',
    status: 'read',
    type: 'text',
  },
  {
    id: '131',
    text: 'arre haan yaar!',
    sender: 'other',
    timestamp: '10:27 pm',
    status: 'read',
    type: 'text',
  },
  {
    id: '132',
    text: 'main toh bhool hi gayi thi tum toh ab chess nahi khelte ho!',
    sender: 'other',
    timestamp: '10:27 pm',
    status: 'read',
    type: 'text',
  },
  {
    id: '133',
    text: '😅',
    sender: 'other',
    timestamp: '10:27 pm',
    status: 'read',
    isEmoji: true,
    type: 'text',
  },
  {
    id: '134',
    text: 'Yd kyu nahi rakha 🥺',
    sender: 'me',
    timestamp: '10:28 pm',
    status: 'read',
    type: 'text',
  },
  {
    id: '135',
    text: 'arre yaar, ab sab kuch yaad thodi na rahega!',
    sender: 'other',
    timestamp: '10:28 pm',
    status: 'read',
    type: 'text',
  },
  {
    id: '136',
    text: '😅',
    sender: 'other',
    timestamp: '10:28 pm',
    status: 'read',
    isEmoji: true,
    type: 'text',
  },
  {
    id: '137',
    text: 'Mai bhul gaya khane mai ky khaya tha maine aur kitne baje khana khaya maine',
    sender: 'me',
    timestamp: '10:30 pm',
    status: 'read',
    type: 'text',
  },
  {
    id: '138',
    text: 'haha!',
    sender: 'other',
    timestamp: '10:30 pm',
    status: 'read',
    type: 'text',
  },
  {
    id: '139',
    text: 'ab itna bhi nahi bhoolna tha!',
    sender: 'other',
    timestamp: '10:30 pm',
    status: 'read',
    type: 'text',
  },
  {
    id: '140',
    text: '😂',
    sender: 'other',
    timestamp: '10:30 pm',
    status: 'read',
    isEmoji: true,
    type: 'text',
  },
  {
    id: '141',
    text: 'bhindi aur chapati khaayi thi tune!',
    sender: 'other',
    timestamp: '10:30 pm',
    status: 'read',
    type: 'text',
  },
  {
    id: '142',
    text: 'aur time tha 9:50 PM ke around',
    sender: 'other',
    timestamp: '10:30 pm',
    status: 'read',
    type: 'text',
  },
  {
    id: '143',
    text: 'Accha idhr barish ho rahi hi abhi',
    sender: 'me',
    timestamp: '10:31 pm',
    status: 'read',
    type: 'text',
  },
  {
    id: '144',
    text: 'arre wah!',
    sender: 'other',
    timestamp: '10:31 pm',
    status: 'read',
    type: 'text',
  },
  {
    id: '145',
    text: 'ab idhar bhi barish ho rahi hai!',
    sender: 'other',
    timestamp: '10:31 pm',
    status: 'read',
    type: 'text',
  },
  {
    id: '146',
    text: 'kya mausam hai!',
    sender: 'other',
    timestamp: '10:31 pm',
    status: 'read',
    type: 'text',
  },
  {
    id: '147',
    text: '😂',
    sender: 'other',
    timestamp: '10:31 pm',
    status: 'read',
    isEmoji: true,
    type: 'text',
  },
  {
    id: '148',
    text: 'Hanji but muze barish pasand nahi hai muze jukham huwa hai abhi',
    sender: 'me',
    timestamp: '10:32 pm',
    status: 'read',
    type: 'text',
  },
  {
    id: '149',
    text: 'oh nooo, jukham hai toh baarish toh bilkul achhi nahi lagti!',
    sender: 'other',
    timestamp: '10:32 pm',
    status: 'read',
    type: 'text',
  },
  {
    id: '150',
    text: 'take care yaar, garam kuch piyo',
    sender: 'other',
    timestamp: '10:32 pm',
    status: 'read',
    type: 'text',
  },
  {
    id: '151',
    text: 'Light bhi chali gayi andhera hogya sb yr , muze tv pai taxi driver dekhni thi',
    sender: 'me',
    timestamp: '10:33 pm',
    status: 'read',
    type: 'text',
  },
  {
    id: '152',
    text: 'oh no!',
    sender: 'other',
    timestamp: '10:33 pm',
    status: 'read',
    type: 'text',
  },
  {
    id: '153',
    text: 'pehla jukham aur ab light bhi chali gayi!',
    sender: 'other',
    timestamp: '10:33 pm',
    status: 'read',
    type: 'text',
  },
  {
    id: '154',
    text: 'kitna bad luck hai yaar!',
    sender: 'other',
    timestamp: '10:33 pm',
    status: 'read',
    type: 'text',
  },
  {
    id: '155',
    text: 'ab kya plan hai?',
    sender: 'other',
    timestamp: '10:33 pm',
    status: 'read',
    type: 'text',
  },
  {
    id: '156',
    text: 'Ky lagta hai',
    sender: 'me',
    timestamp: '11:07 pm',
    status: 'read',
    type: 'text',
  },
  {
    id: '157',
    text: 'arre yaar, light nahi hai toh kya karein ab?',
    sender: 'other',
    timestamp: '11:07 pm',
    status: 'read',
    type: 'text',
  },
  {
    id: '158',
    text: 'kya lagta hai, kya karna chahiye?',
    sender: 'other',
    timestamp: '11:07 pm',
    status: 'read',
    type: 'text',
  },
];

const CURRENT_USER: User = {
  name: "Ira",
  avatar: "https://picsum.photos/seed/ira/200/200",
  status: "online"
};

const AttachMenuItem = ({ icon: Icon, color, label, onClick }: { icon: any, color: string, label: string, onClick?: () => void }) => (
  <button
    onClick={onClick}
    className="flex items-center gap-3 px-6 py-3 hover:bg-[#f5f6f6] transition-colors w-full text-left"
  >
    <Icon size={20} className={color} strokeWidth={2.5} />
    <span className="text-[#3b4a54] text-[14.5px]">{label}</span>
  </button>
);

const AudioMessage = ({ audioUrl, duration, isMe }: { audioUrl: string, duration: number, isMe: boolean }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateProgress = () => {
      setProgress((audio.currentTime / audio.duration) * 100);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(0);
    };

    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateProgress);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-3 min-w-[200px] py-1">
      <audio ref={audioRef} src={audioUrl} />
      <button onClick={togglePlay} className="text-[#54656f]">
        {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
      </button>
      <div className="flex-1 flex flex-col gap-1">
        <div className="h-1 bg-gray-300 rounded-full overflow-hidden">
          <div
            className={`h-full ${isMe ? 'bg-[#00a884]' : 'bg-[#54656f]'}`}
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between text-[11px] text-[#667781]">
          <span>{formatTime(audioRef.current?.currentTime || 0)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
      <div className="relative w-8 h-8 rounded-full overflow-hidden bg-gray-200">
        <img src={isMe ? "https://picsum.photos/seed/me/100/100" : CURRENT_USER.avatar} className="w-full h-full object-cover opacity-80" alt="avatar" />
        <div className="absolute bottom-0 right-0">
          <Mic size={12} className={isMe ? "text-[#00a884]" : "text-[#54656f]"} />
        </div>
      </div>
    </div>
  );
};

export default function WhatsAppClone() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [inputText, setInputText] = useState('');
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioTranscript, setAudioTranscript] = useState<string>(''); // For Speech-to-Text
  const [isTyping, setIsTyping] = useState(false);
  const [activeMessageMenu, setActiveMessageMenu] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null); // Reference to SpeechRecognition instance

  const getDateLabel = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const msgDate = new Date(dateStr);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      // Reset times to compare dates only
      msgDate.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);
      yesterday.setHours(0, 0, 0, 0);

      const diffTime = today.getTime() - msgDate.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 0) return 'Today';
      if (diffDays === 1) return 'Yesterday';
      if (diffDays > 1 && diffDays < 7) {
        return msgDate.toLocaleDateString('en-US', { weekday: 'long' });
      }
      // If none of the above, just return the string format
      return dateStr;
    } catch (e) {
      return dateStr; // fallback
    }
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);

  // Load conversation history from Redis on mount
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const response = await fetch('/api/conversation?userId=pandurang');
        const data = await response.json();

        if (data.success && data.messages && data.messages.length > 0) {
          // Convert Redis messages to component format
          const loadedMessages = data.messages.map((msg: any) => ({
            id: msg.id,
            text: msg.text,
            sender: msg.sender,
            timestamp: msg.timestamp, // Use stored timestamp string like "5:51 pm"
            date: msg.date || 'February 23, 2026', // Default date
            dayOfWeek: msg.dayOfWeek || 'Monday', // Default day
            status: msg.status || 'read',
            type: msg.type || 'text',
            isEmoji: msg.isEmoji,
            replyTo: msg.replyTo,
            audioUrl: msg.audioUrl,
            audioDuration: msg.audioDuration,
          }));

          setMessages(loadedMessages);
          console.log('📬 Loaded', loadedMessages.length, 'messages from Redis');
        } else {
          // No history, initialize with INITIAL_MESSAGES and save to Redis
          setMessages(INITIAL_MESSAGES);

          // Save initial messages to Redis with their original timestamps
          const redisMessages = INITIAL_MESSAGES.map(msg => ({
            id: msg.id,
            sender: msg.sender,
            type: msg.type,
            text: msg.text,
            timestamp: msg.timestamp, // Keep original time like "5:51 pm"
            date: msg.date || 'February 23, 2026', // Default to Feb 23, 2026
            dayOfWeek: msg.dayOfWeek || 'Monday', // Default to Monday
            status: msg.status,
            isEmoji: msg.isEmoji,
            replyTo: msg.replyTo,
          }));

          await fetch('/api/conversation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: 'pandurang',
              messages: redisMessages,
            }),
          });

          console.log('💾 Initialized Redis with', INITIAL_MESSAGES.length, 'messages');
        }
      } catch (error) {
        console.error('Failed to load conversation history:', error);
        setMessages(INITIAL_MESSAGES);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    loadHistory();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isRecording, showEmojiPicker, showAttachMenu, isTyping]);

  // Save messages to Redis whenever they change
  useEffect(() => {
    const saveMessages = async () => {
      if (isLoadingHistory || messages.length === 0) return;

      try {
        const now = new Date();
        const currentDate = now.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' });

        const redisMessages = messages.map(msg => ({
          id: msg.id,
          sender: msg.sender,
          type: msg.type,
          text: msg.text,
          timestamp: msg.timestamp, // Keep display time like "5:51 pm"
          date: msg.date || currentDate, // Use message date or current date
          dayOfWeek: msg.dayOfWeek || currentDay, // Use message day or current day
          status: msg.status,
          isEmoji: msg.isEmoji,
          replyTo: msg.replyTo,
          audioUrl: msg.audioUrl,
          audioDuration: msg.audioDuration,
        }));

        await fetch('/api/conversation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: 'pandurang',
            messages: redisMessages,
          }),
        });

        console.log('💾 Saved', messages.length, 'messages to Redis');
      } catch (error) {
        console.error('Failed to save messages:', error);
      }
    };

    // Debounce saves to avoid too many requests
    const timeoutId = setTimeout(saveMessages, 1000);
    return () => clearTimeout(timeoutId);
  }, [messages, isLoadingHistory]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim()) return;

    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase();
    const currentDate = now.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' });

    const userMessage = inputText;
    const newMessage: Message = {
      id: Date.now().toString(),
      text: userMessage,
      sender: 'me',
      timestamp: timeString,
      date: currentDate, // Today's date
      dayOfWeek: currentDay, // Today's day
      status: 'sent',
      replyTo: replyingTo?.id,
      type: 'text',
    };

    setMessages(prev => [...prev, newMessage]);
    setInputText('');
    setReplyingTo(null);
    setShowEmojiPicker(false);

    // Simulate status updates
    setTimeout(() => {
      setMessages(prev => prev.map(m => m.id === newMessage.id ? { ...m, status: 'delivered' } : m));
    }, 1000);

    setTimeout(() => {
      setMessages(prev => prev.map(m => m.id === newMessage.id ? { ...m, status: 'read' } : m));
    }, 2000);

    // Show typing indicator
    setTimeout(() => {
      setIsTyping(true);
    }, 2500);

    // Call Bedrock API
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          conversationHistory: messages.filter(m => m.type === 'text').slice(-10),
        }),
      });

      const data = await response.json();

      setIsTyping(false);

      if (data.success && data.messages && Array.isArray(data.messages)) {
        // Send multiple messages one by one (WhatsApp style)
        for (let i = 0; i < data.messages.length; i++) {
          // Show typing indicator before each message
          if (i > 0) {
            setIsTyping(true);
            await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 400)); // Random delay 800-1200ms
            setIsTyping(false);
          }

          const replyDate = new Date();
          const replyTime = replyDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase();
          const replyDateStr = replyDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });
          const replyDay = replyDate.toLocaleDateString('en-US', { weekday: 'long' });

          // Check if message is just an emoji
          const isEmojiOnly = /^[\p{Emoji}\s]+$/u.test(data.messages[i]);

          const replyMessage: Message = {
            id: `${Date.now()}-${i}`,
            text: data.messages[i],
            sender: 'other',
            timestamp: replyTime,
            date: replyDateStr, // Today's date
            dayOfWeek: replyDay, // Today's day
            status: 'read',
            type: 'text',
            isEmoji: isEmojiOnly,
          };

          setMessages(prev => [...prev, replyMessage]);

          // Small delay between messages
          if (i < data.messages.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 200)); // 300-500ms
          }
        }
      } else {
        // Fallback message on error
        const replyDate = new Date();
        const replyTime = replyDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase();
        const replyDateStr = replyDate.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        const replyDay = replyDate.toLocaleDateString('en-US', { weekday: 'long' });

        const replyMessage: Message = {
          id: Date.now().toString(),
          text: "Sorry, I'm having trouble responding right now. Please try again.",
          sender: 'other',
          timestamp: replyTime,
          date: replyDateStr, // Today's date
          dayOfWeek: replyDay, // Today's day
          status: 'read',
          type: 'text',
        };
        setMessages(prev => [...prev, replyMessage]);
      }
    } catch (error) {
      console.error('Error calling chat API:', error);
      setIsTyping(false);

      const replyDate = new Date();
      const replyTime = replyDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase();
      const replyDateStr = replyDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      const replyDay = replyDate.toLocaleDateString('en-US', { weekday: 'long' });

      const replyMessage: Message = {
        id: Date.now().toString(),
        text: "Sorry, I encountered an error. Please try again.",
        sender: 'other',
        timestamp: replyTime,
        date: replyDateStr, // Today's date
        dayOfWeek: replyDay, // Today's day
        status: 'read',
        type: 'text',
      };
      setMessages(prev => [...prev, replyMessage]);
    }
  };

  const onEmojiClick = (emojiData: EmojiClickData) => {
    setInputText(prev => prev + emojiData.emoji);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      setAudioTranscript(''); // Reset transcript

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
      };

      // Set up Speech Recognition
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.lang = 'hi-IN'; // Default to Hinglish/Hindi
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onresult = (event: any) => {
          let transcript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            transcript += event.results[i][0].transcript;
          }
          setAudioTranscript(prev => prev + transcript);
        };

        recognition.onerror = (e: any) => console.error('Speech recognition error:', e);

        recognitionRef.current = recognition;
        recognition.start();
      }

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);

      timerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Could not access microphone. Please check permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
      if (recognitionRef.current) recognitionRef.current.stop();
    }
  };

  const cancelRecording = () => {
    stopRecording();
    setAudioBlob(null);
    setAudioTranscript('');
    setRecordingDuration(0);
    chunksRef.current = [];
  };

  const sendAudioMessage = () => {
    // Stop recording first
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
      if (recognitionRef.current) recognitionRef.current.stop();
    }

    // Wait a bit for the onstop event to fire and blob to be created
    setTimeout(async () => {
      const blob = audioBlob || (chunksRef.current.length > 0 ? new Blob(chunksRef.current, { type: 'audio/webm' }) : null);

      if (!blob) {
        // Fallback if recording failed or was empty
        console.warn("No audio recorded");
        return;
      }

      const audioUrl = URL.createObjectURL(blob);
      const now = new Date();
      const timeString = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase();
      const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' });
      const currentDate = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

      const newMessage: Message = {
        id: Date.now().toString(),
        sender: 'me',
        timestamp: timeString,
        date: currentDate,
        dayOfWeek: currentDay,
        status: 'sent',
        type: 'audio',
        audioUrl: audioUrl,
        audioDuration: recordingDuration || 1, // Ensure at least 1 sec
        replyTo: replyingTo?.id,
      };

      setMessages(prev => [...prev, newMessage]);
      setReplyingTo(null);
      setAudioBlob(null);
      setRecordingDuration(0);
      chunksRef.current = [];
      const transcript = audioTranscript.trim();
      setAudioTranscript('');

      // Simulate status updates
      setTimeout(() => {
        setMessages(prev => prev.map(m => m.id === newMessage.id ? { ...m, status: 'delivered' } : m));
      }, 1000);

      setTimeout(() => {
        setMessages(prev => prev.map(m => m.id === newMessage.id ? { ...m, status: 'read' } : m));
      }, 2000);

      // Start typing indicator
      setTimeout(() => setIsTyping(true), 2500);

      try {
        // Use transcription if available, else generic fallback
        const messageText = transcript
          ? `(Voice message transcript: "${transcript}")`
          : '(User sent a voice message but transcription failed or was empty.)';

        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: messageText,
            conversationHistory: messages.filter(m => m.type === 'text' || m.type === 'image' || m.type === 'audio').slice(-10),
          }),
        });

        const data = await response.json();
        setIsTyping(false);

        if (data.success && data.messages && Array.isArray(data.messages)) {
          for (let i = 0; i < data.messages.length; i++) {
            if (i > 0) {
              setIsTyping(true);
              await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 400));
              setIsTyping(false);
            }

            const replyDate = new Date();
            const replyTime = replyDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase();
            const replyDateStr = replyDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
            const replyDay = replyDate.toLocaleDateString('en-US', { weekday: 'long' });

            const replyMsg: Message = {
              id: (Date.now() + i).toString(),
              text: data.messages[i],
              sender: 'other',
              timestamp: replyTime,
              date: replyDateStr,
              dayOfWeek: replyDay,
              status: 'read',
              type: 'text',
            };
            setMessages(prev => [...prev, replyMsg]);
          }
        }
      } catch (error) {
        console.error('Audio chat error:', error);
        setIsTyping(false);
      }

    }, 200);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'document') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase();
    const currentDate = now.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' });

    if (type === 'document') {
      // Document: just show as text message
      const newMessage: Message = {
        id: Date.now().toString(),
        sender: 'me',
        timestamp: timeString,
        date: currentDate,
        dayOfWeek: currentDay,
        status: 'sent',
        type: 'text',
        text: `📄 ${file.name}`,
      };
      setMessages(prev => [...prev, newMessage]);
      setShowAttachMenu(false);
      e.target.value = '';
      return;
    }

    // Image: convert to base64 and send to LLM
    setShowAttachMenu(false);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64Data = event.target?.result as string;
      if (!base64Data) return;

      // Create image message with preview
      const msgId = Date.now().toString();
      const imageMessage: Message = {
        id: msgId,
        sender: 'me',
        timestamp: timeString,
        date: currentDate,
        dayOfWeek: currentDay,
        status: 'sent',
        type: 'image',
        imageUrl: base64Data,
      };

      setMessages(prev => [...prev, imageMessage]);

      // Status updates
      setTimeout(() => {
        setMessages(prev => prev.map(m => m.id === msgId ? { ...m, status: 'delivered' } : m));
      }, 1000);
      setTimeout(() => {
        setMessages(prev => prev.map(m => m.id === msgId ? { ...m, status: 'read' } : m));
      }, 2000);

      // Show typing indicator
      setTimeout(() => setIsTyping(true), 2500);

      // Send to API with image data
      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: '(User sent an image)',
            imageData: base64Data,
            conversationHistory: messages.filter(m => m.type === 'text' || m.type === 'image').slice(-10),
          }),
        });

        const data = await response.json();
        setIsTyping(false);

        if (data.success && data.messages && Array.isArray(data.messages)) {
          for (let i = 0; i < data.messages.length; i++) {
            if (i > 0) {
              setIsTyping(true);
              await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 400));
              setIsTyping(false);
            }

            const replyDate = new Date();
            const replyTime = replyDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase();
            const replyDateStr = replyDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
            const replyDay = replyDate.toLocaleDateString('en-US', { weekday: 'long' });

            const replyMsg: Message = {
              id: (Date.now() + i).toString(),
              text: data.messages[i],
              sender: 'other',
              timestamp: replyTime,
              date: replyDateStr,
              dayOfWeek: replyDay,
              status: 'read',
              type: 'text',
            };
            setMessages(prev => [...prev, replyMsg]);
          }
        }
      } catch (error) {
        console.error('Image chat error:', error);
        setIsTyping(false);
      }
    };

    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#d1d7db] font-sans" onClick={() => {
      setActiveMessageMenu(null);
      if (showAttachMenu) setShowAttachMenu(false);
      if (showEmojiPicker) setShowEmojiPicker(false);
    }}>
      {/* Main Container */}
      <div className="relative flex h-full w-full max-w-[1600px] mx-auto bg-[#efeae2] shadow-lg overflow-hidden xl:my-0 xl:h-full xl:w-full">

        {/* Background Pattern Overlay */}
        <div className="absolute inset-0 opacity-40 pointer-events-none z-0"
          style={{
            backgroundImage: `url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")`,
            backgroundRepeat: 'repeat',
            backgroundSize: '400px'
          }}
        />

        {/* Header */}
        <header className="absolute top-0 left-0 right-0 h-[60px] bg-[#f0f2f5] px-4 flex items-center justify-between z-20 border-b border-[#e9edef]">
          <div className="flex items-center gap-4 cursor-pointer">
            <div className="w-10 h-10 rounded-full overflow-hidden">
              <img src={CURRENT_USER.avatar} alt={CURRENT_USER.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
            <div className="flex flex-col justify-center">
              <h1 className="text-[#111b21] text-[16px] font-medium leading-tight">{CURRENT_USER.name}</h1>
            </div>
          </div>
          <div className="flex items-center gap-6 text-[#54656f]">
            <button className="hover:bg-black/5 p-2 rounded-full transition-colors"><Search size={20} strokeWidth={2} /></button>
            {/* Removed MoreVertical button as requested */}
          </div>
        </header>

        {/* Chat Area */}
        <main className="flex-1 flex flex-col w-full h-full pt-[60px] pb-[62px] z-10 relative">

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:px-[6%] custom-scrollbar">

            {/* Message List */}
            <div className="flex flex-col gap-1 pt-4">
              {messages.map((msg, index) => {
                const isMe = msg.sender === 'me';
                const showTail = index === messages.length - 1 || messages[index + 1]?.sender !== msg.sender;
                const repliedMessage = msg.replyTo ? messages.find(m => m.id === msg.replyTo) : null;
                const previousMsg = index > 0 ? messages[index - 1] : null;
                const showDateHeader = !previousMsg || previousMsg.date !== msg.date;

                return (
                  <React.Fragment key={msg.id}>
                    {/* Date grouping header */}
                    {showDateHeader && msg.date && (
                      <div className="flex justify-center my-3 w-full">
                        <div className="bg-white/90 backdrop-blur-sm text-[#54656f] text-[12.5px] font-medium px-3 py-1.5 rounded-lg shadow-sm border border-black/5">
                          {getDateLabel(msg.date)}
                        </div>
                      </div>
                    )}

                    <motion.div
                      key={`msg-${msg.id}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'} ${showTail ? 'mb-2' : 'mb-[2px]'} group`}
                    >
                      <div
                        className={`
                        relative max-w-[85%] sm:max-w-[60%] px-2 py-1.5 rounded-lg shadow-sm text-[14.2px] leading-[19px] text-[#111b21]
                        ${isMe ? 'bg-[#d9fdd3] rounded-tr-none' : 'bg-white rounded-tl-none'}
                        ${msg.isEmoji ? 'text-[40px] bg-transparent shadow-none !p-0' : ''}
                      `}
                      >
                        {/* Tail SVG */}
                        {showTail && !msg.isEmoji && (
                          <span className={`absolute top-0 ${isMe ? '-right-[8px]' : '-left-[8px]'} w-[8px] h-[13px] overflow-hidden`}>
                            <svg viewBox="0 0 8 13" width="8" height="13" className={`w-full h-full fill-current ${isMe ? 'text-[#d9fdd3]' : 'text-white'}`}>
                              <path opacity="0.13" d={isMe ? "M5.188 1H0v11.193l6.467-8.625C7.526 2.156 6.958 1 5.188 1z" : "M1.533 3.568L8 12.193V1H2.812C1.042 1 .474 2.156 1.533 3.568z"}></path>
                              <path d={isMe ? "M5.188 0H0v11.193l6.467-8.625C7.526 1.156 6.958 0 5.188 0z" : "M1.533 2.568L8 11.193V0H2.812C1.042 0 .474 1.156 1.533 2.568z"}></path>
                            </svg>
                          </span>
                        )}

                        {/* Reply Context */}
                        {repliedMessage && (
                          <div className={`mb-1 rounded-[4px] overflow-hidden bg-black/5 border-l-4 ${repliedMessage.sender === 'me' ? 'border-[#00a884]' : 'border-[#a855f7]'} p-1.5 cursor-pointer`}>
                            <div className={`text-[12.5px] font-medium ${repliedMessage.sender === 'me' ? 'text-[#00a884]' : 'text-[#a855f7]'}`}>
                              {repliedMessage.sender === 'me' ? 'You' : CURRENT_USER.name}
                            </div>
                            <div className="text-[12.5px] text-[#54656f] line-clamp-1">
                              {repliedMessage.type === 'audio' ? '🎤 Audio Message' : repliedMessage.text}
                            </div>
                          </div>
                        )}

                        {/* Message Content */}
                        {msg.type === 'image' ? (
                          <div className="-mx-1 -mt-0.5 mb-1">
                            <img
                              src={msg.imageUrl}
                              alt="Shared image"
                              className="rounded-lg max-w-full max-h-[300px] object-cover cursor-pointer"
                              style={{ minWidth: '200px' }}
                              onClick={() => window.open(msg.imageUrl, '_blank')}
                            />
                            {msg.text && (
                              <div className="break-words whitespace-pre-wrap pr-20 pb-1 pl-1 pt-1">
                                {msg.text}
                              </div>
                            )}
                          </div>
                        ) : msg.type === 'text' ? (
                          <div className={`break-words whitespace-pre-wrap ${msg.isEmoji ? 'p-2' : 'pr-20 pb-1 pl-1'}`}>
                            {msg.text}
                          </div>
                        ) : (
                          <div className="pr-2 pb-1 pl-1">
                            <AudioMessage audioUrl={msg.audioUrl!} duration={msg.audioDuration!} isMe={isMe} />
                          </div>
                        )}

                        {/* Metadata (Time & Status) */}
                        {!msg.isEmoji && (
                          <div className="absolute bottom-1 right-2 flex items-center gap-1 select-none">
                            <span className="text-[11px] text-[#667781]">{msg.timestamp}</span>
                            {isMe && (
                              <span className={`text-[16px] ${msg.status === 'read' ? 'text-[#53bdeb]' : 'text-[#667781]'}`}>
                                {msg.status === 'read' ? <CheckCheck size={16} /> : <Check size={16} />}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Emoji Metadata (Different positioning) */}
                        {msg.isEmoji && (
                          <div className={`flex justify-end items-center gap-1 select-none mt-1 px-2 py-1 rounded-full bg-black/5 backdrop-blur-sm w-fit ml-auto ${isMe ? '' : 'mr-auto'}`}>
                            <span className="text-[10px] text-[#444]">{msg.timestamp}</span>
                            {isMe && (
                              <span className={`text-[14px] ${msg.status === 'read' ? 'text-[#00a884]' : 'text-[#666]'}`}>
                                {msg.status === 'read' ? <CheckCheck size={14} /> : <Check size={14} />}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Message Dropdown Trigger */}
                        {!msg.isEmoji && (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMessageMenu(activeMessageMenu === msg.id ? null : msg.id);
                              }}
                              className={`absolute top-0 right-0 p-1 opacity-0 group-hover:opacity-100 ${activeMessageMenu === msg.id ? 'opacity-100' : ''} transition-opacity z-10`}
                            >
                              <div className="bg-[#f0f2f5]/50 hover:bg-[#f0f2f5] rounded-full p-1 shadow-sm backdrop-blur-sm">
                                <ChevronDown size={18} className="text-[#54656f]" />
                              </div>
                            </button>

                            {/* Dropdown Menu */}
                            <AnimatePresence>
                              {activeMessageMenu === msg.id && (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.9, y: 0 }}
                                  animate={{ opacity: 1, scale: 1, y: 0 }}
                                  exit={{ opacity: 0, scale: 0.9, y: 0 }}
                                  className="absolute top-8 right-4 bg-white rounded-lg shadow-[0_2px_5px_0_rgba(11,20,26,0.26),0_2px_10px_0_rgba(11,20,26,0.16)] py-2 w-52 z-50 flex flex-col origin-top-right"
                                >
                                  <button className="px-4 py-2.5 hover:bg-[#f5f6f6] text-left text-[#3b4a54] text-[14.5px] leading-[14.5px] flex items-center gap-3" onClick={() => { setReplyingTo(msg); setActiveMessageMenu(null); }}>Reply</button>
                                  <button className="px-4 py-2.5 hover:bg-[#f5f6f6] text-left text-[#3b4a54] text-[14.5px] leading-[14.5px] flex items-center gap-3">Forward</button>
                                  <button className="px-4 py-2.5 hover:bg-[#f5f6f6] text-left text-[#3b4a54] text-[14.5px] leading-[14.5px] flex items-center gap-3">React</button>
                                  <button className="px-4 py-2.5 hover:bg-[#f5f6f6] text-left text-[#3b4a54] text-[14.5px] leading-[14.5px] flex items-center gap-3">Star</button>
                                  <button className="px-4 py-2.5 hover:bg-[#f5f6f6] text-left text-[#3b4a54] text-[14.5px] leading-[14.5px] flex items-center gap-3">Delete</button>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </>
                        )}
                      </div>
                    </motion.div>
                  </React.Fragment>
                );
              })}

              {/* Typing Indicator */}
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex w-full justify-start mb-2"
                >
                  <div className="relative bg-white rounded-lg rounded-tl-none shadow-sm px-4 py-3">
                    {/* Tail SVG */}
                    <span className="absolute top-0 -left-[8px] w-[8px] h-[13px] overflow-hidden">
                      <svg viewBox="0 0 8 13" width="8" height="13" className="w-full h-full fill-current text-white">
                        <path opacity="0.13" d="M1.533 3.568L8 12.193V1H2.812C1.042 1 .474 2.156 1.533 3.568z"></path>
                        <path d="M1.533 2.568L8 11.193V0H2.812C1.042 0 .474 1.156 1.533 2.568z"></path>
                      </svg>
                    </span>

                    <div className="flex gap-1">
                      <motion.div
                        animate={{ y: [0, -5, 0] }}
                        transition={{ repeat: Infinity, duration: 0.6, delay: 0 }}
                        className="w-2 h-2 bg-[#667781] rounded-full"
                      />
                      <motion.div
                        animate={{ y: [0, -5, 0] }}
                        transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }}
                        className="w-2 h-2 bg-[#667781] rounded-full"
                      />
                      <motion.div
                        animate={{ y: [0, -5, 0] }}
                        transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }}
                        className="w-2 h-2 bg-[#667781] rounded-full"
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input Area */}
          <footer className="absolute bottom-0 left-0 right-0 min-h-[62px] bg-[#f0f2f5] px-4 py-2 flex flex-col z-20 border-t border-[#e9edef]">

            {/* Attach Menu */}
            <AnimatePresence>
              {showAttachMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  className="absolute bottom-[70px] left-4 bg-white rounded-xl shadow-[0_2px_5px_0_rgba(11,20,26,0.26),0_2px_10px_0_rgba(11,20,26,0.16)] py-2 w-60 z-30 flex flex-col origin-bottom-left"
                >
                  <AttachMenuItem icon={FileText} color="text-[#7f66ff]" label="Document" onClick={() => documentInputRef.current?.click()} />
                  <AttachMenuItem icon={ImageIcon} color="text-[#007bfc]" label="Photos & videos" onClick={() => imageInputRef.current?.click()} />
                  <AttachMenuItem icon={Camera} color="text-[#ff2e74]" label="Camera" onClick={() => alert("Camera API integration required")} />
                  <AttachMenuItem icon={User} color="text-[#009de2]" label="Contact" onClick={() => setShowAttachMenu(false)} />
                  <AttachMenuItem icon={BarChart2} color="text-[#ffbc38]" label="Poll" onClick={() => setShowAttachMenu(false)} />
                  <AttachMenuItem icon={Sticker} color="text-[#00a884]" label="New sticker" onClick={() => setShowAttachMenu(false)} />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Hidden File Inputs */}
            <input
              type="file"
              ref={imageInputRef}
              style={{ display: 'none' }}
              accept="image/*,video/*"
              onChange={(e) => handleFileUpload(e, 'image')}
            />
            <input
              type="file"
              ref={documentInputRef}
              style={{ display: 'none' }}
              accept="*"
              onChange={(e) => handleFileUpload(e, 'document')}
            />

            {/* Emoji Picker */}
            <AnimatePresence>
              {showEmojiPicker && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="absolute bottom-[70px] left-4 z-30"
                >
                  <EmojiPicker onEmojiClick={onEmojiClick} width={300} height={400} />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Reply Preview */}
            <AnimatePresence>
              {replyingTo && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="w-full bg-[#f0f2f5] mb-2 overflow-hidden"
                >
                  <div className="bg-white rounded-lg p-2 border-l-4 border-[#00a884] flex justify-between items-center mx-12 relative">
                    <div className="flex-1">
                      <div className="text-[12.5px] font-medium text-[#00a884]">
                        {replyingTo.sender === 'me' ? 'You' : CURRENT_USER.name}
                      </div>
                      <div className="text-[12.5px] text-[#54656f] line-clamp-1">
                        {replyingTo.type === 'audio' ? '🎤 Audio Message' : replyingTo.text}
                      </div>
                    </div>
                    <button onClick={() => setReplyingTo(null)} className="p-1 hover:bg-[#f0f2f5] rounded-full">
                      <X size={20} className="text-[#54656f]" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-end gap-2 w-full">
              <div className="flex items-center gap-2 mb-2 text-[#54656f]">
                <button
                  onClick={(e) => { e.stopPropagation(); setShowAttachMenu(!showAttachMenu); }}
                  className={`p-1 rounded-full transition-colors ${showAttachMenu ? 'bg-[#f0f2f5] rotate-45' : 'hover:bg-black/5'}`}
                >
                  <Plus size={24} className={`transition-transform duration-200 ${showAttachMenu ? 'rotate-45' : ''}`} />
                </button>
              </div>

              {isRecording ? (
                <div className="flex-1 bg-white rounded-lg flex items-center min-h-[42px] px-4 py-2 shadow-sm border border-white mb-1 justify-between">
                  <div className="flex items-center gap-3">
                    <motion.div
                      animate={{ opacity: [1, 0.5, 1] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                      className="text-red-500"
                    >
                      <Mic size={20} fill="currentColor" />
                    </motion.div>
                    <span className="text-[#54656f] font-mono text-lg">{formatDuration(recordingDuration)}</span>
                  </div>
                  <button onClick={cancelRecording} className="text-[#54656f] hover:text-red-500 transition-colors">
                    <Trash2 size={20} />
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={handleSendMessage}
                  className="flex-1 bg-white rounded-lg flex items-center min-h-[42px] px-4 py-2 shadow-sm border border-white focus-within:border-white mb-1"
                >
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setShowEmojiPicker(!showEmojiPicker); }}
                    className={`mr-3 hover:text-[#444] transition-colors ${showEmojiPicker ? 'text-[#00a884]' : 'text-[#54656f]'}`}
                  >
                    <Smile size={24} />
                  </button>
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Type a message"
                    className="flex-1 bg-transparent outline-none text-[#111b21] placeholder:text-[#667781] text-[15px]"
                  />
                </form>
              )}

              <div className="flex items-center gap-2 mb-2 text-[#54656f]">
                {inputText.trim() ? (
                  <button
                    onClick={() => handleSendMessage()}
                    className="p-2 bg-[#00a884] text-white rounded-full hover:bg-[#008f6f] transition-colors shadow-sm"
                  >
                    <Send size={20} fill="white" />
                  </button>
                ) : (
                  <>
                    {isRecording ? (
                      <button
                        onClick={sendAudioMessage}
                        className="p-2 bg-[#00a884] text-white rounded-full hover:bg-[#008f6f] transition-colors shadow-sm"
                      >
                        <Send size={20} fill="white" />
                      </button>
                    ) : (
                      <button
                        onClick={startRecording}
                        className="p-2 hover:bg-black/5 rounded-full transition-colors"
                      >
                        <Mic size={24} />
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </footer>
        </main>
      </div>

      {/* Global Styles for Scrollbar */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(0, 0, 0, 0.2);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: rgba(0, 0, 0, 0.3);
        }
      `}</style>
    </div>
  );
}
