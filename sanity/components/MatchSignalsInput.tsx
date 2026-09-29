import {Badge, Card, Flex, Stack, Text} from '@sanity/ui'
import type {ArrayOfObjectsInputProps} from 'sanity'

import {MATCH_THRESHOLD} from '../lib/detector'

// The Zombie Detector's signals, shown as a checklist in the Coroner's report tab
// instead of the default list of array items. Read-only: the coroner writes them.

type Signal = {_key: string; label?: string; matched?: boolean; detail?: string; points?: number}

export function MatchSignalsInput(props: ArrayOfObjectsInputProps) {
  const signals = (props.value ?? []) as Signal[]
  const score = signals.reduce((sum, signal) => sum + (signal.points ?? 0), 0)

  return (
    <Card padding={3} radius={2} border tone="transparent">
      <Stack space={3}>
        {signals.map((signal) => (
          <Flex key={signal._key} gap={3} align="center">
            <Text size={2} aria-label={signal.matched ? 'matched' : 'not matched'}>
              {signal.matched ? '✓' : '✗'}
            </Text>
            <Stack space={2} flex={1}>
              <Text size={1} weight="semibold">
                {signal.label}
              </Text>
              <Text size={1} muted>
                {signal.detail}
              </Text>
            </Stack>
            <Badge tone={signal.points ? 'positive' : 'default'}>+{signal.points ?? 0}</Badge>
          </Flex>
        ))}
        <Text size={1} muted>
          Match score {score} from {signals.length} signals. A possible resurrection needs {MATCH_THRESHOLD}.
        </Text>
      </Stack>
    </Card>
  )
}
