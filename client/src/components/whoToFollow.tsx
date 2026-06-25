import UnderlinedText from "./ui/underlinedText";
import TinyProfile from "./user/tinyProfile";

const mockProfiles: Profile[] = [
  {
    id: 123,
    username: "cyber_wanderer",
    image: "/temp/ (12).jpg",
    followed: true,
    banner: "/temp/ (5).jpg",
    status: "Exploring the digital wilderness. 🌐",
    followers: 1420,
  },
  {
    id: 212,
    username: "pixel_chef",
    image: "/temp/ (24).jpg",
    followed: false,
    banner: "/temp/ (19).jpg",
    followers: 89,
  },
  {
    id: 312,
    username: "neon_ghost",
    image: "/temp/ (3).jpg",
    followed: true,
    status: "Now you see me, now you don't.",
    followers: 5300,
  },
  {
    id: 412,
    username: "code_coffee_repeat",
    image: "/temp/ (31).jpg",
    followed: false,
    banner: "/temp/ (8).jpg",
    status: "Building things with caffeine.",
    followers: 245,
  },
];

export default function WhoToFollow() {
  return (
    <div className="w-full px-5 py-3 bg-white dark:bg-primaryBlack rounded-xl shadow-sm flex flex-col gap-6">
      <UnderlinedText>Who to follow</UnderlinedText>
      <div className="flex flex-col gap-6">
        {mockProfiles.map((profile) => (
          <TinyProfile key={profile.id} user={profile} />
        ))}
      </div>
    </div>
  );
}
