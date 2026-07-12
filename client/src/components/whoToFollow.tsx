import { useQuery } from "@tanstack/react-query";
import UnderlinedText from "./ui/underlinedText";
import TinyProfile from "./user/tinyProfile";
import { API_URL } from "@/utils/userHelpers";
import axios from "axios";
import { Loader2 } from "lucide-react";
import { USER_LIST_KEY } from "./user/followButton";

export default function WhoToFollow() {
  const { data, isError, isPending } = useQuery({
    queryKey: ["whoToFollow"],
    queryFn: async () => {
      const res = await axios.get<Profile[]>(`${API_URL}/users/popular`, {
        withCredentials: true,
      });
      return res.data;
    },
  });
  return (
    <div className="w-full px-5 py-3 bg-white dark:bg-primaryBlack rounded-xl shadow-sm flex flex-col gap-6">
      <UnderlinedText>Who to follow</UnderlinedText>
      <div className="flex flex-col gap-6">
        {isError ? (
          <div>Error Loading Users</div>
        ) : isPending ? (
          <Loader2 className="animate-spin" />
        ) : (
          data &&
          data.map((profile) => (
            <TinyProfile
              key={profile.id}
              user={profile}
              listKeys={[[USER_LIST_KEY.whoToFollow]]}
            />
          ))
        )}
      </div>
    </div>
  );
}
