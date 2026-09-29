import {useQuery} from '@sanity/sdk-react'

// Two facts about the whole graveyard that the lifecycle buttons need, fetched once
// for the board and kept live:
// - which bugs have unpublished Studio changes (a draft or a release version), since
//   the buttons write straight to the published bug and a draft would later
//   overwrite them (the same rule as the Studio's actions);
// - which graves a zombie has already risen from, since a grave only rises once.
const FACTS_QUERY = `{
  "unpublished": *[_type == "bug" && (_id in path("drafts.**") || _id in path("versions.**"))]._id,
  "risen": *[_type == "bug" && defined(previousLife) && !(_id in path("drafts.**")) && !(_id in path("versions.**"))]{
    "from": previousLife._ref,
    name
  }
}`

export interface BoardFacts {
  /** Published IDs of bugs with unpublished changes */
  unpublished: Set<string>
  /** Grave ID → the name of the zombie that rose from it */
  risenAs: Map<string, string>
}

interface FactsResult {
  unpublished: string[]
  risen: {from: string; name: string | null}[]
}

// "drafts.abc" and "versions.<release>.abc" both belong to "abc"
const publishedId = (id: string) => id.replace(/^(drafts|versions\.[^.]+)\./, '')

export function useBoardFacts(): BoardFacts {
  const {data} = useQuery<FactsResult>({query: FACTS_QUERY, perspective: 'raw'})
  return {
    unpublished: new Set((data?.unpublished ?? []).map(publishedId)),
    risenAs: new Map((data?.risen ?? []).map((r) => [r.from, r.name ?? 'a zombie'])),
  }
}
