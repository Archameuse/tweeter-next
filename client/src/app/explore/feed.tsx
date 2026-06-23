"use client";

import { PageContainer } from "@/components/ui/pageContainer";
import { SectionFragment } from "@/components/ui/sectionFragment";
import { useState } from "react";

export default function ExploreFeed() {
  enum STATUS {
    top = "Top",
    latest = "Latest",
    media = "Media",
  }
  const [status, setStatus] = useState<STATUS>(STATUS.top);
  return (
    <PageContainer>
      <div>
        <aside className="sticky top-4 py-5 w-full lg:w-80 shrink-0 flex flex-col gap-4 bg-white dark:bg-secondaryGray shadow-md dark:shadow-primaryBlack rounded-lg h-fit">
          <SectionFragment
            onClick={() => setStatus(STATUS.top)}
            active={status === STATUS.top}
          >
            {STATUS.top}
          </SectionFragment>
          <SectionFragment
            onClick={() => setStatus(STATUS.latest)}
            active={status === STATUS.latest}
          >
            {STATUS.latest}
          </SectionFragment>
          <SectionFragment
            onClick={() => setStatus(STATUS.media)}
            active={status === STATUS.media}
          >
            {STATUS.media}
          </SectionFragment>
        </aside>
      </div>
    </PageContainer>
  );
}
